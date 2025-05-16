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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isDarkMode, toggleDarkMode } = useTheme();

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    await signOut({ redirect: true, callbackUrl: '/' });
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
                onClick={() => signIn('github')}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${isDarkMode
                    ? 'text-gray-800 bg-gray-200 hover:bg-gray-300'
                    : 'text-white bg-gray-800 hover:bg-gray-700'
                  }`}
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                Iniciar Sesión con GitHub
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
    </nav>
  );
} 