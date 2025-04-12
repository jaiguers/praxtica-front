'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { githubService, GithubVerificationResponse, TestResult } from '@/services/githubService';
import { CHALLENGE_DATA } from '@/data/challenges';

interface Step {
  id: number;
  title: string;
  status: 'completed' | 'pending' | 'failed';
  isActive: boolean;
}

interface Challenge {
  title: string;
  subtitle: string;
  steps: Step[];
}

export default function ChallengePage() {
  const { isDarkMode } = useTheme();
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const slug = params?.slug as string;
        const challengeData = CHALLENGE_DATA[slug];
        if (!challengeData) {
          throw new Error('Desafío no encontrado');
        }
        
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleVerifyStep = async () => {
    try {
      setIsVerifying(true);
      setShowTestResults(true);
      
      const slug = params?.slug as string;
      const githubUsername = session?.user?.name || '';
      
      const results = await githubService.verifyChallenge(
        slug,
        challenge?.steps[currentStep].id || 0,
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
    return null; // No renderizar nada mientras redirige
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
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Botón del menú hamburguesa - visible solo en móvil/tablet */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800 text-white"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isSidebarOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      <div className="flex">
        {/* Sidebar - responsive */}
        <div className={`fixed lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } w-72 min-h-screen p-6 border-r z-40 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="mb-8">
            <h2 className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {challenge.title}
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {challenge.subtitle}
            </p>
          </div>
          
          <nav>
            <ul className="space-y-2">
              {challenge.steps.map((step, index) => (
                <li key={step.id}>
                  <button
                    onClick={() => {
                      setCurrentStep(index);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                      currentStep === index
                        ? isDarkMode
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-100 text-gray-900'
                        : isDarkMode
                          ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {step.status === 'completed' ? (
                      <svg className="w-5 h-5 mr-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className={`w-5 h-5 mr-3 rounded-full border-2 ${
                        currentStep === index
                          ? isDarkMode
                            ? 'border-white'
                            : 'border-gray-900'
                          : isDarkMode
                            ? 'border-gray-400'
                            : 'border-gray-600'
                      }`} />
                    )}
                    <span className="text-sm font-medium">{step.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Overlay para cerrar el sidebar en móvil */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content - ajustado para ser más grande */}
        <div className="flex-1 p-4 lg:p-8 w-full">
          <div className="max-w-[90%] mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {challenge.steps[currentStep].title}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                getStatusColor(challenge.steps[currentStep].status)
              }`}>
                {challenge.steps[currentStep].status === 'completed' ? 'Completed' : 'In Progress'}
              </span>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('instructions')}
                  className={`${
                    activeTab === 'instructions'
                      ? isDarkMode
                        ? 'border-blue-500 text-blue-500'
                        : 'border-blue-600 text-blue-600'
                      : isDarkMode
                        ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                >
                  Instrucciones
                </button>
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`${
                    activeTab === 'videos'
                      ? isDarkMode
                        ? 'border-blue-500 text-blue-500'
                        : 'border-blue-600 text-blue-600'
                      : isDarkMode
                        ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                >
                  Videos
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'instructions' ? (
              <div className={`space-y-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <div className={`p-6 rounded-lg mb-4 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                } shadow-sm`}>
                  <h2 className={`text-lg font-medium mb-4 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Instructions
                  </h2>
                  {/* Aquí iría el contenido de las instrucciones */}
                </div>

                {showTestResults && (
                  <div className={`p-6 rounded-lg mb-4 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  } shadow-sm`}>
                    <h3 className={`text-lg font-medium mb-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Resultados de las Pruebas
                    </h3>
                    
                    {isVerifying ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                        <span className="ml-3">Verificando cambios...</span>
                      </div>
                    ) : verificationResults ? (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-lg ${
                          verificationResults.success 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100'
                            : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        }`}>
                          {verificationResults.message}
                        </div>
                        
                        {verificationResults.testResults?.map((test: TestResult, index: number) => (
                          <div key={index} className={`p-4 rounded-lg ${
                            test.passed
                              ? 'bg-emerald-50 dark:bg-emerald-900/20'
                              : 'bg-red-50 dark:bg-red-900/20'
                          }`}>
                            <div className="flex items-start">
                              <div className={`mt-0.5 mr-3 ${
                                test.passed ? 'text-emerald-500' : 'text-red-500'
                              }`}>
                                {test.passed ? (
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{test.description}</p>
                                {test.details && (
                                  <pre className="mt-2 p-2 rounded bg-gray-100 dark:bg-gray-800 text-sm overflow-x-auto">
                                    {test.details}
                                  </pre>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ) : (
              <div className={`p-6 rounded-lg mb-8 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-sm`}>
                <h2 className={`text-lg font-medium mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Videos
                </h2>
                <div className="w-full">
                  <div className="relative w-full aspect-w-16 aspect-h-9">
                    <iframe
                      src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                      title="Tutorial del desafío"
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div className="mt-4">
                    <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Tutorial: {challenge.steps[currentStep].title}
                    </h3>
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Este video te guiará paso a paso en la resolución del desafío actual.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentStep === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>
              <button
                onClick={handleVerifyStep}
                disabled={isVerifying}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  isVerifying
                    ? 'opacity-50 cursor-not-allowed'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                {isVerifying ? 'Verificando...' : 'Continuar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}