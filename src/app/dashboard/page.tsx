'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  status: string;
  repoUrl: string | null;
  type?: string;
}

const MOCK_CHALLENGES: Challenge[] = [
  {
    id: 'docker-clone',
    title: 'Build a Docker Clone',
    description: 'Create a simplified version of Docker using Go',
    difficulty: 'Difícil',
    status: 'pending',
    repoUrl: null,
  },
  {
    id: 'redis-clone',
    title: 'Build a Redis Clone',
    description: 'Implement basic Redis functionality in Python',
    difficulty: 'Intermedio',
    status: 'pending',
    repoUrl: null,
  },
  {
    id: 'git-clone',
    title: 'Build a Git Clone',
    description: 'Create a basic version control system in Rust',
    difficulty: 'Difícil',
    status: 'pending',
    repoUrl: null,
  },
  {
    id: 'sqlite-clone',
    title: 'Build a SQLite Clone',
    description: 'Build a simple SQL database engine in C',
    difficulty: 'Difícil',
    status: 'pending',
    repoUrl: null,
  },
  {
    id: 'load-balancer',
    title: 'Build a Load Balancer',
    description: 'Create a basic load balancer in Go',
    difficulty: 'Intermedio',
    status: 'pending',
    repoUrl: null,
  },
  {
    id: 'english-practice',
    title: 'Práctica de Inglés con IA',
    description: 'Mejora tu inglés conversando con una IA especializada en enseñanza de idiomas. Practica pronunciación, gramática y vocabulario en conversaciones naturales.',
    difficulty: 'Todos los niveles',
    status: 'available',
    type: 'english',
    repoUrl: null
  },
];

export default function Dashboard() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [challenges, setChallenges] = useState(MOCK_CHALLENGES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChallenges = async () => {
      try {
        setLoading(true);
        // Simulamos una carga
        await new Promise(resolve => setTimeout(resolve, 1000));
        setChallenges(MOCK_CHALLENGES);
        setError(null);
      } catch (error) {
        console.error('Error loading challenges:', error);
        setError('Error al cargar los desafíos');
      } finally {
        setLoading(false);
      }
    };

    loadChallenges();
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'fácil':
        return isDarkMode ? 'text-green-400' : 'text-green-600';
      case 'intermedio':
        return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
      case 'difícil':
        return isDarkMode ? 'text-red-400' : 'text-red-600';
      default:
        return isDarkMode ? 'text-gray-400' : 'text-gray-600';
    }
  };

  const handleStartChallenge = async (challenge: Challenge) => {
    try {
      if (challenge.type === 'english') {
        router.push('/english-practice');
        return;
      }

      // Redirigir a la página del desafío
      router.push(`/challenges/${challenge.id}`);

      // Actualizar el estado del desafío
      const newChallenges = challenges.map((c) =>
        c.id === challenge.id
          ? {
              ...c,
              status: 'in_progress',
              repoUrl: `https://github.com/username/${c.title.toLowerCase().replace(/ /g, '-')}`,
            }
          : c
      );
      setChallenges(newChallenges);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className={`text-center ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            <p className="text-lg">Error al cargar los desafíos</p>
            <button
              onClick={() => window.location.reload()}
              className={`mt-4 px-4 py-2 rounded-md ${
                isDarkMode
                  ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className={`text-3xl font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Desafíos Disponibles
          </h1>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {challenges.map((challenge) => (
              <div
                key={challenge.id}
                className={`rounded-lg shadow-md overflow-hidden ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                <div className="p-6">
                  <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {challenge.title}
                  </h3>
                  <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {challenge.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                      {challenge.difficulty}
                    </span>
                    {challenge.repoUrl ? (
                      <a
                        href={challenge.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-sm font-medium ${
                          isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                        }`}
                      >
                        Ver Repositorio
                      </a>
                    ) : (
                      <button
                        onClick={() => handleStartChallenge(challenge)}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          isDarkMode
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        Comenzar Desafío
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 