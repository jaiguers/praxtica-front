'use client';

import { useTheme } from '@/context/ThemeContext';
import Image from "next/image";

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
          <p className={`mt-6 text-xl text-center max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
            Mejora tus habilidades de programación construyendo versiones simplificadas de tus herramientas favoritas
          </p>
        </div>
      </section>
      {/* Sección desafios - Imagen */}
      <section className="py-20 from-transparent to-gray-100 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Selecciona tu desafío</h2>
          <div className="max-w-5xl mx-auto">
            <div className="relative aspect-[21/9] rounded-lg overflow-hidden shadow-2xl">
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
          <h2 className="text-3xl font-bold text-center mb-8">Y practica desde tu editor de código</h2>
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
