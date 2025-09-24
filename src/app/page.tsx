'use client';

import { useTheme } from '@/context/ThemeContext';
import Image from "next/image";
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function Home() {
  const { isDarkMode } = useTheme();
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

  return (
    <>
      {/* Primera sección - Título */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-center bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            La práctica hace al maestro
          </h1>
          <p className={`mt-6 text-xl text-center max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Mejora tus habilidades de programación construyendo versiones simplificadas de tus herramientas favoritas
          </p>
        </div>
      </section>
      {/* Sección desafios - Imagen */}
      <section className="py-20 from-transparent to-gray-100 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 p-1 mr-2 align-middle">
              <span className={`flex items-center justify-center w-full h-full rounded-full bg-white dark:bg-gray-900 text-4xl font-bold text-black dark:text-white`}>
                1
              </span>
            </span>
            Para comenzar un desafío, inicia sesión
          </h2>
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setIsSignInModalOpen(true)}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${isDarkMode
                  ? 'text-gray-800 bg-gray-200 hover:bg-gray-300'
                  : 'text-white bg-gray-800 hover:bg-gray-700'
                }`}
              >
                Comenzar Gratis
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* Sección desafios - Imagen */}
      <section className="py-20 from-transparent to-gray-100 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 p-1 mr-2 align-middle">
              <span className={`flex items-center justify-center w-full h-full rounded-full bg-white dark:bg-gray-900 text-4xl font-bold text-black dark:text-white`}>
                2
              </span>
            </span>
            Selecciona tu desafío
          </h2>
          <div className="max-w-5xl mx-auto">
            <div 
              className="relative aspect-[21/9] rounded-lg overflow-hidden shadow-2xl cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => signIn('github')}
            >
              <Image
                src="/images/desafios.png"
                alt="Desafios praxtica"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Segunda sección - Imagen */}
      <section className="py-20 from-transparent to-gray-100 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 p-1 mr-2 align-middle">
              <span className={`flex items-center justify-center w-full h-full rounded-full bg-white dark:bg-gray-900 text-4xl font-bold text-black dark:text-white`}>
                3
              </span>
            </span>
            Y practica desde tu editor de código
          </h2>
          <div className="max-w-5xl mx-auto">
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden shadow-2xl">
              <Image
                src="/images/vs-code-img.png"
                alt="Editor de código VS Code en modo oscuro mostrando praxtica"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

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
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
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
                            <path fill="#f25022" d="M0 0h11v11H0z"/>
                            <path fill="#7fba00" d="M12 0h11v11H12z"/>
                            <path fill="#00a4ef" d="M0 12h11v11H0z"/>
                            <path fill="#ffb900" d="M12 12h11v11H12z"/>
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
    </>
  );
}
