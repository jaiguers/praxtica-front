'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { githubService, GithubVerificationResponse } from '@/services/githubService';
import { challengeService } from '@/services/challengeService';
import { Challenge } from '@/types/challenge';

export default function ChallengePage() {
  const { isDarkMode } = useTheme();
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'instructions' | 'videos'>('instructions');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResults, setVerificationResults] = useState<GithubVerificationResponse | null>(null);
  const [showTestResults, setShowTestResults] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push('/');
      return;
    }

    const loadChallenge = async () => {
      try {
        setLoading(true);
        const slug = params?.slug as string;
        const challengeData = await challengeService.getChallengeById(slug);
        setChallenge(challengeData);
        setError(null);
      } catch (error) {
        console.error('Error loading challenge:', error);
        setError('Error al cargar el desafío');
      } finally {
        setLoading(false);
      }
    };

    loadChallenge();
  }, [params?.slug, session, router]);

  const handleVerifyStep = async () => {
    try {
      setIsVerifying(true);
      setShowTestResults(true);

      const slug = params?.slug as string;
      const githubUsername = session?.user?.name || '';

      const results = await githubService.verifyChallenge(
        slug,
        currentStep || 0,
        githubUsername
      );

      setVerificationResults(results);

      if (results.success) {
        const updatedSteps = challenge?.steps.map((step, index) => {
          if (index === currentStep) {
            return { ...step, status: 'completed' as const };
          }
          return step;
        });

        setChallenge(prev => prev ? { ...prev, steps: updatedSteps || [] } : null);
      }
    } catch (error) {
      console.error('Error during verification:', error);
      setVerificationResults({
        success: false,
        message: 'Error al verificar el desafío',
        testResults: []
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!session) {
    return null;
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className={`text-center ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          <p className="text-lg">{error || 'Desafío no encontrado'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <div className={`w-80 flex-shrink-0 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-y-auto`}>
        <div className="p-6">
          {/* Challenge Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0012 18.75c-1.03 0-1.96-.474-2.596-1.26l-.547-.547z" />
                </svg>
              </div>
              <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {challenge.title}
              </h1>
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} ml-11`}>
              using {challenge.subtitle}
            </p>
          </div>

          {/* Steps List */}
          <div className="space-y-2">
            {challenge.steps.map((step, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  currentStep === index
                    ? isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-900'
                    : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center w-full">
                  {step.isActive ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center mr-3 flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className={`w-6 h-6 rounded flex items-center justify-center mr-3 flex-shrink-0 ${
                      isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                    }`}>
                      #
                    </div>
                  )}
                  <span className="block font-medium text-left">{step.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('instructions')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'instructions'
                        ? isDarkMode
                          ? 'border-blue-500 text-blue-400'
                          : 'border-blue-500 text-blue-600'
                        : isDarkMode
                          ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Instrucciones
                  </button>
                  <button
                    onClick={() => setActiveTab('videos')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'videos'
                        ? isDarkMode
                          ? 'border-blue-500 text-blue-400'
                          : 'border-blue-500 text-blue-600'
                        : isDarkMode
                          ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Videos
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'instructions' && (
              <div className={`prose ${isDarkMode ? 'prose-invert' : ''} max-w-none`}>
                <div dangerouslySetInnerHTML={{ __html: challenge.steps[currentStep].description }} />
                {challenge.steps[currentStep].tabs.instructions?.task && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Tarea</h3>
                    <p>{challenge.steps[currentStep].tabs.instructions.task.description}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'videos' && challenge.steps[currentStep].tabs.video && (
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src={challenge.steps[currentStep].tabs.video}
                  className="w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Verification Button */}
            <div className="mt-8">
              <button
                onClick={handleVerifyStep}
                disabled={isVerifying}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  isDarkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300'
                }`}
              >
                {isVerifying ? 'Verificando...' : 'Verificar Paso'}
              </button>
            </div>

            {/* Verification Results */}
            {showTestResults && verificationResults && (
              <div className={`mt-6 p-4 rounded-lg ${
                verificationResults.success
                  ? isDarkMode ? 'bg-emerald-900/20' : 'bg-emerald-50'
                  : isDarkMode ? 'bg-red-900/20' : 'bg-red-50'
              }`}>
                <h3 className={`text-lg font-medium mb-2 ${
                  verificationResults.success
                    ? isDarkMode ? 'text-emerald-400' : 'text-emerald-800'
                    : isDarkMode ? 'text-red-400' : 'text-red-800'
                }`}>
                  {verificationResults.success ? '¡Éxito!' : 'Error'}
                </h3>
                <p className={`text-sm ${
                  verificationResults.success
                    ? isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
                    : isDarkMode ? 'text-red-300' : 'text-red-700'
                }`}>
                  {verificationResults.message}
                </p>
                {verificationResults.testResults && verificationResults.testResults.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Resultados de las pruebas:</h4>
                    <ul className="space-y-2">
                      {verificationResults.testResults.map((result, index) => (
                        <li key={index} className={`text-sm ${
                          result.passed
                            ? isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
                            : isDarkMode ? 'text-red-300' : 'text-red-700'
                        }`}>
                          {result.description}: {result.passed ? '✓' : '✗'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}