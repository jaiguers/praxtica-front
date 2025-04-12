'use client';

import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';

export default function Thanks() {
  const { isDarkMode } = useTheme();

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center px-4">
        <div className="mb-8">
          <svg
            className={`w-20 h-20 mx-auto ${isDarkMode ? 'text-green-400' : 'text-green-500'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          ¡Gracias por tu compra!
        </h1>
        <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Estamos emocionados de tenerte como parte de nuestra comunidad.
          Pronto recibirás un correo electrónico con los detalles de tu suscripción.
        </p>
        <Link
          href="/dashboard"
          className={`inline-flex items-center px-6 py-3 rounded-lg text-white font-medium transition-colors ${
            isDarkMode ? 'bg-green-500 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          Ir al Dashboard
          <svg
            className="ml-2 w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
      </div>
    </div>
  )
} 