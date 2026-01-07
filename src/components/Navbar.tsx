'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useTheme } from '@/context/ThemeContext';

export default function Navbar() {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'github' | 'google' | ''>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isDarkMode, toggleDarkMode } = useTheme();

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  const handleSignIn = async (provider: 'github' | 'google') => {
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

  const NavLinks = () => (
    <>
      {session && (
        <Link
          href="/dashboard"
          className={`text-sm font-medium ${isDarkMode ? 'text-gray-200 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Dashboard
        </Link>
      )}
      <Link
        href="/plans"
        className={`text-sm font-medium ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-black'
          }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        Planes
      </Link>
      <Link
        href="/blog"
        className={`text-sm font-medium ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-black'
          }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        Blog
      </Link>
    </>
  );

  return (
    <nav className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow transition-colors duration-200`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo y Menú Desktop */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src={isDarkMode ? "/images/logo.svg" : "/images/logo-dark.svg"}
                alt="Praxtica Logo"
                width={56}
                height={56}
                className="h-10 md:h-14 w-auto"
                priority
              />
            </Link>
            <div className="hidden md:flex items-center space-x-8 ml-8">
              <NavLinks />
            </div>
          </div>

          {/* Botones y Avatar */}
          <div className="flex items-center space-x-4">
            {/* Botón Menú Móvil */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-500"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
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

            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-600'
                }`}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            {/* Ranking Number - Solo para usuarios logueados */}
            {session && (
              <div className={`hidden sm:flex items-center justify-center px-3 py-1 rounded-full font-medium text-sm ${isDarkMode ? 'bg-gray-700 text-emerald-400' : 'bg-gray-200 text-emerald-600'
                }`}>
                Pts: {session.user?.ranking}
              </div>
            )}

            {session ? (
              <div className="relative" ref={dropdownRef}>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <Image
                    className="h-8 w-8 rounded-full"
                    src={session.user?.image || ''}
                    alt={session.user?.name || ''}
                    width={32}
                    height={32}
                  />
                  {isDropdownOpen && (
                    <div className={`absolute right-0 mt-2 w-48 py-1 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                      }`}>
                      <div className={`px-4 py-2 text-sm border-b ${isDarkMode ? 'text-gray-200 border-gray-700' : 'text-gray-700 border-gray-200'
                        }`}>
                        <p className="font-medium">{session.user?.name}</p>
                        <p className={`truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {session.user?.email}
                        </p>
                        <div className="mt-2 sm:hidden">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-gray-700 text-emerald-400' : 'bg-gray-200 text-emerald-600'
                            }`}>
                            Ranking: {session.user?.ranking}
                          </span>
                        </div>
                      </div>
                      <Link
                        href="/redeem-ranking"
                        className={`block w-full text-left px-4 py-2 text-sm ${isDarkMode
                            ? 'text-gray-200 hover:bg-gray-700'
                            : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        Redimir Ranking
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className={`block w-full text-left px-4 py-2 text-sm ${isDarkMode
                            ? 'text-gray-200 hover:bg-gray-700'
                            : 'text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsSignInModalOpen(true)}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${isDarkMode
                    ? 'text-gray-800 bg-gray-200 hover:bg-gray-300'
                    : 'text-white bg-gray-800 hover:bg-gray-700'
                  }`}
              >
                Iniciar Sesión
              </button>
            )}
          </div>
        </div>

        {/* Menú Móvil */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-700">
            <div className="flex flex-col space-y-3">
              <NavLinks />
            </div>
          </div>
        )}
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
                             <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                             <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                             <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                             <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                           </svg>
                         )}
                         {loadingProvider === 'google' ? 'Iniciando sesión...' : 'Iniciar Sesión con Google'}
                       </button>
                      
                       {/* Comentado temporalmente - Microsoft OAuth no implementado aún
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
                       */}
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
    </nav>
  );
} 