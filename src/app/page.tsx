'use client';

import { useTheme } from '@/context/ThemeContext';
import Image from "next/image";
import { signIn } from 'next-auth/react';

export default function Home() {
  const { isDarkMode } = useTheme();

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
    </>
  );
}
