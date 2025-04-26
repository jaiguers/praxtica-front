'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { challengeService } from '@/services/challengeService';
import { Challenge } from '@/types/challenge';

export default function Dashboard() {
  const { isDarkMode } = useTheme();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const data = await challengeService.getAllChallenges();
        setChallenges(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching challenges:', error);
        setError('Error al cargar los desafíos');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchChallenges();
    }
  }, [session]);

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'fácil':
      case 'easy':
        return isDarkMode ? 'text-green-400' : 'text-green-600';
      case 'intermedio':
      case 'medium':
        return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
      case 'difícil':
      case 'hard':
        return isDarkMode ? 'text-red-400' : 'text-red-600';
      default:
        return isDarkMode ? 'text-gray-400' : 'text-gray-600';
    }
  };

  const handleStartChallenge = (challenge: Challenge) => {
    if (challenge.type.toLowerCase() === 'english') {
      router.push(`/english-practice/${challenge._id}`);
    } else if (challenge.type.toLowerCase() === 'spanish') {
      router.push(`/spanish-practice/${challenge._id}`);
    } else {
      router.push(`/challenges/${challenge._id}`);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className={`text-center ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          <p className="text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} py-12 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-7xl mx-auto">
        <h1 className={`text-3xl font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Desafíos Disponibles
        </h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((challenge) => (
            <div
              key={challenge._id}
              className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-800/50 hover:bg-gray-800/70' : 'bg-white hover:bg-gray-50'
                } transition-colors duration-200 shadow-sm`}
            >
              <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {challenge.title}
              </h3>
              <p className={`mb-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {challenge.description}
              </p>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${getDifficultyColor(challenge.level)}`}>
                  {challenge.level}
                </span>
                <button
                  onClick={() => handleStartChallenge(challenge)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                >
                  Comenzar Desafío
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 