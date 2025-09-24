'use client';

import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useState } from 'react';

export default function Plans() {
  const { isDarkMode } = useTheme();
  const { data: session } = useSession();
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string>('');

  const handleSignIn = async (provider: 'github' | 'google' | 'microsoft') => {
    setIsLoading(true);
    setLoadingProvider(provider);
    try {
      await signIn(provider, { callbackUrl: '/' });
    } catch (error) {
      console.error('Error during sign in:', error);
      setIsLoading(false);
      setLoadingProvider('');
    }
  };

  const getButtonProps = (wompiLink: string) => {
    return {
      href: wompiLink,
      text: wompiLink.includes('ysVnjr') ? 'Comenzar ahora' :
        wompiLink.includes('X1EkJt') ? 'Ahorrar ahora' : 'Pagar ahora'
    };
  };

  return (
    <div className="py-24">
      <div className="container mx-auto px-4">
        {/* Encabezado */}
        <div className="text-center mb-16">
          <h1 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Planes y Precios
          </h1>
          <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Elige el plan que mejor se adapte a tus necesidades
          </p>
        </div>

        {/* Planes */}
        <div className={`grid gap-8 max-w-7xl mx-auto md:grid-cols-3`}>
          {/* Plan Gratuito - Solo visible si no hay sesión */}
          {!session && (
            <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-lg p-8 transition-transform duration-300 hover:scale-105`}>
              <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Plan Gratuito
              </h3>
              <div className="mb-6">
                <span className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  $0
                </span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>/siempre</span>
              </div>
              <ul className={`mb-8 space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Acceso a los desafíos gratuitos
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Acceso a la comunidad
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Recursos básicos
                </li>
              </ul>
              <button
                onClick={() => setIsSignInModalOpen(true)}
                className={`block w-full py-3 px-4 rounded-lg font-semibold text-center ${isDarkMode
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
                  }`}
              >
                Comenzar Gratis
              </button>
            </div>
          )}

          {/* Plan Mensual */}
          <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-lg p-8 transition-transform duration-300 hover:scale-105`}>
            <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Plan Mensual
            </h3>
            <div className="mb-6">
              <span className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                $150.000
              </span>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>/mes</span>
            </div>
            <ul className={`mb-8 space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Acceso a todos los desafíos
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Soporte por correo
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Acceso a la comunidad
              </li>
            </ul>
            <Link
              href={getButtonProps('https://checkout.wompi.co/l/ysVnjr').href}
              className={`block w-full py-3 px-4 rounded-lg font-semibold text-center ${isDarkMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
            >
              {getButtonProps('https://checkout.wompi.co/l/ysVnjr').text}
            </Link>
          </div>

          {/* Plan Anual */}
          <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800 border-2 border-blue-500' : 'bg-white border-2 border-blue-500'
            } shadow-xl p-8 transform translate-y-[-1rem] transition-transform duration-300 hover:scale-105`}>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className={`px-3 py-1 text-sm rounded-full ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                }`}>
                Más popular
              </span>
            </div>
            <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Plan Anual
            </h3>
            <div className="mb-6">
              <span className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                $700.000
              </span>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>/año</span>
            </div>
            <ul className={`mb-8 space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Todo lo del plan mensual
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Soporte prioritario
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Acceso a webinars mensuales
              </li>
            </ul>
            <Link
              href={getButtonProps('https://checkout.wompi.co/l/X1EkJt').href}
              className={`block w-full py-3 px-4 rounded-lg font-semibold text-center ${isDarkMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
            >
              {getButtonProps('https://checkout.wompi.co/l/X1EkJt').text}
                         </Link>
           </div>
         </div>
      </div>

      {/* Modal de Inicio de Sesión */}
      {isSignInModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity z-40" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:align-middle z-50 relative">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                      Iniciar Sesión
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => handleSignIn('github')}
                        disabled={isLoading}
                        className={`w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {loadingProvider === 'github' ? (
                          <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                          </svg>
                        )}
                        {loadingProvider === 'github' ? 'Iniciando sesión...' : 'Iniciar Sesión con GitHub'}
                      </button>

                      <button
                        onClick={() => handleSignIn('google')}
                        disabled={isLoading}
                        className={`w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {loadingProvider === 'google' ? (
                          <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                        )}
                        {loadingProvider === 'google' ? 'Iniciando sesión...' : 'Iniciar Sesión con Google'}
                      </button>

                      <button
                        onClick={() => handleSignIn('microsoft')}
                        disabled={isLoading}
                        className={`w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {loadingProvider === 'microsoft' ? (
                          <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                            <path fill="#f25022" d="M0 0h11v11H0z" />
                            <path fill="#7fba00" d="M12 0h11v11H12z" />
                            <path fill="#00a4ef" d="M0 12h11v11H0z" />
                            <path fill="#ffb900" d="M12 12h11v11H12z" />
                          </svg>
                        )}
                        {loadingProvider === 'microsoft' ? 'Iniciando sesión...' : 'Iniciar Sesión con Microsoft'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={() => setIsSignInModalOpen(false)}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-gray-500 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}