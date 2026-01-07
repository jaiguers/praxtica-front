'use client';

import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { MicrophoneIcon, CodeBracketIcon, SpeakerWaveIcon, ChatBubbleLeftRightIcon, ClockIcon, BookOpenIcon, MapPinIcon, LightBulbIcon, EyeIcon, GlobeAltIcon, UserPlusIcon, AdjustmentsHorizontalIcon, TrophyIcon, CheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export default function Home() {
  const { isDarkMode } = useTheme();
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'github' | 'google' | ''>('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const words = [
    { text: 'Idiomas', gradient: 'from-blue-500 to-purple-600' },
    { text: 'Código', gradient: 'from-purple-600 to-blue-500' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
        setIsAnimating(false);
      }, 300); // Half of the animation duration
    }, 3000); // Change word every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSignIn = async (provider: 'github' | 'google') => {
    setIsLoading(true);
    setLoadingProvider(provider);
    try {
      await signIn(provider, { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Error during sign in:', error);
      setIsLoading(false);
      setLoadingProvider('');
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'} relative`}>
      {/* Gradiente decorativo lila en la esquina superior izquierda */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-500/20 via-purple-400/10 to-transparent rounded-full blur-3xl"></div>
      
      {/* Hero Section */}
      <section className={`py-20 px-4 relative ${isDarkMode ? 'grid-pattern-dark' : 'grid-pattern'}`}>
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Domina </span>
            <span className="relative inline-block overflow-hidden">
              <span 
                key={currentWordIndex}
                className={`bg-gradient-to-r ${words[currentWordIndex].gradient} text-transparent bg-clip-text block ${
                  isAnimating ? 'slide-out-up' : 'slide-in-up'
                }`}
              >
                {words[currentWordIndex].text}
              </span>
            </span>
            <br />
            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>con la AI como Compañera</span>
          </h1>
          
          <p className={`text-lg md:text-xl mb-8 max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Practica inglés y español conversacional o supera desafíos de programación reales. 
            Tu AI coworker te guía, corrige y te ayuda a crecer.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => setIsSignInModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Prueba 7 días gratis
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={() => scrollToSection('como-funciona')}
              className="px-8 py-4 rounded-lg font-semibold text-lg border-2 border-gray-400 text-gray-300 hover:border-white hover:text-white transition-all duration-300"
            >
              Ver cómo funciona
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text mb-2">
                10K+
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Usuarios activos
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text mb-2">
                1M+
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Conversaciones
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text mb-2">
                50K+
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Desafíos completados
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-20 px-4 relative ${isDarkMode ? 'grid-pattern-dark' : 'grid-pattern'}`}>
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            
            {/* Language Practice Card */}
            <div className={`rounded-2xl p-8 border-2 border-blue-500 shadow-lg transform hover:scale-105 transition-all duration-300 animate-float hover:shadow-blue-500/30 ${
              isDarkMode 
                ? 'bg-gray-800 shadow-blue-500/20' 
                : 'bg-gray-50 shadow-blue-500/10'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <MicrophoneIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Práctica de Idiomas
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Conversación por voz con AI
                  </p>
                </div>
              </div>
              
              <div className={`rounded-xl p-6 mb-6 ${
                isDarkMode ? 'bg-gray-900' : 'bg-white'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <SpeakerWaveIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    AI hablando...
                  </div>
                  
                  {/* Animated Sound Waves */}
                  <div className="flex items-center gap-1 ml-2">
                    <div className="w-1 bg-gradient-to-t from-blue-400 to-blue-600 rounded-full animate-sound-wave-1" style={{height: '12px'}}></div>
                    <div className="w-1 bg-gradient-to-t from-blue-400 to-blue-600 rounded-full animate-sound-wave-2" style={{height: '8px'}}></div>
                    <div className="w-1 bg-gradient-to-t from-blue-400 to-blue-600 rounded-full animate-sound-wave-3" style={{height: '16px'}}></div>
                    <div className="w-1 bg-gradient-to-t from-blue-400 to-blue-600 rounded-full animate-sound-wave-4" style={{height: '6px'}}></div>
                    <div className="w-1 bg-gradient-to-t from-blue-400 to-blue-600 rounded-full animate-sound-wave-5" style={{height: '14px'}}></div>
                    <div className="w-1 bg-gradient-to-t from-blue-400 to-blue-600 rounded-full animate-sound-wave-6" style={{height: '10px'}}></div>
                    <div className="w-1 bg-gradient-to-t from-blue-400 to-blue-600 rounded-full animate-sound-wave-7" style={{height: '18px'}}></div>
                    <div className="w-1 bg-gradient-to-t from-blue-400 to-blue-600 rounded-full animate-sound-wave-8" style={{height: '8px'}}></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <MicrophoneIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <div className={`text-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Toca para hablar
                </div>
              </div>
            </div>

            {/* Code Challenges Card */}
            <div className={`rounded-2xl p-8 border-2 border-purple-500 shadow-lg transform hover:scale-105 transition-all duration-300 animate-float-delayed hover:shadow-purple-500/30 ${
              isDarkMode 
                ? 'bg-gray-800 shadow-purple-500/20' 
                : 'bg-gray-50 shadow-purple-500/10'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center">
                  <CodeBracketIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Desafíos de Código
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Proyectos reales con AI
                  </p>
                </div>
              </div>
              
              <div className={`rounded-xl p-6 font-mono text-sm ${
                isDarkMode ? 'bg-gray-900 text-green-400' : 'bg-gray-900 text-green-400'
              }`}>
                <div className="mb-2">
                  <span className="text-gray-500">// Tu AI coworker sugiere:</span>
                </div>
                <div className="mb-2">
                  <span className="text-blue-400">function</span>{' '}
                  <span className="text-yellow-400">getUserData</span>
                  <span className="text-white">(</span>
                  <span className="text-orange-400">data</span>
                  <span className="text-white">) {'{'}</span>
                </div>
                <div className="ml-4 mb-2">
                  <span className="text-gray-500">// Implementa aquí...</span>
                </div>
                <div>
                  <span className="text-white">{'}'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Una plataforma, dos superpoderes */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Una plataforma, </span>
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">muchos superpoderes</span>
          </h2>
          
          <p className={`text-lg mb-16 max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Ya sea que quieras dominar un idioma o convertirte en mejor desarrollador, Praxtica 
            te acompaña en cada paso.
          </p>

          {/* Two main sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
            
            {/* Práctica de Idiomas Section */}
            <div>
              <div className="flex items-center gap-3 mb-8 justify-center lg:justify-start">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <MicrophoneIcon className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Práctica de Idiomas
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Inglés & Español conversacional
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Conversaciones Naturales */}
                <div className={`p-6 rounded-xl border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-500" />
                  </div>
                  <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Conversaciones Naturales
                  </h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Practica diálogos fluidos como si hablaras con un nativo. La AI se adapta a tu nivel.
                  </p>
                </div>

                {/* Corrección en Tiempo Real */}
                <div className={`p-6 rounded-xl border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                    <ClockIcon className="w-6 h-6 text-blue-500" />
                  </div>
                  <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Corrección en Tiempo Real
                  </h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Recibe feedback instantáneo sobre gramática, pronunciación y vocabulario.
                  </p>
                </div>

                {/* Escenarios Prácticos */}
                <div className={`p-6 rounded-xl border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                    <BookOpenIcon className="w-6 h-6 text-blue-500" />
                  </div>
                  <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Escenarios Prácticos
                  </h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Desde entrevistas de trabajo hasta viajes, practica situaciones del mundo real.
                  </p>
                </div>

                {/* Aprendizaje Adaptativo */}
                <div className={`p-6 rounded-xl border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                    <MapPinIcon className="w-6 h-6 text-blue-500" />
                  </div>
                  <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Aprendizaje Adaptativo
                  </h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    El sistema aprende de tus errores y refuerza las áreas que necesitas mejorar.
                  </p>
                </div>
              </div>
            </div>

            {/* Desafíos de Código Section */}
            <div>
              <div className="flex items-center gap-3 mb-8 justify-center lg:justify-start">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center">
                  <CodeBracketIcon className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Desafíos de Código
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Programación con AI coworker
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Proyectos Reales */}
                <div className={`p-6 rounded-xl border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                    <CodeBracketIcon className="w-6 h-6 text-purple-500" />
                  </div>
                  <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Proyectos Reales
                  </h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Trabaja en desafíos basados en problemas que enfrentan desarrolladores profesionales.
                  </p>
                </div>

                {/* AI como Coworker */}
                <div className={`p-6 rounded-xl border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                    <LightBulbIcon className="w-6 h-6 text-purple-500" />
                  </div>
                  <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    AI como Coworker
                  </h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Tu compañero AI te ayuda con code reviews, debugging y mejores prácticas.
                  </p>
                </div>

                {/* Feedback Instantáneo */}
                <div className={`p-6 rounded-xl border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                    <EyeIcon className="w-6 h-6 text-purple-500" />
                  </div>
                  <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Feedback Instantáneo
                  </h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Recibe sugerencias de optimización y aprende patrones de código limpio.
                  </p>
                </div>

                {/* Múltiples Lenguajes */}
                <div className={`p-6 rounded-xl border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                    <GlobeAltIcon className="w-6 h-6 text-purple-500" />
                  </div>
                  <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Múltiples Lenguajes
                  </h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Python, JavaScript, TypeScript, React, y más. Expande tu stack tecnológico.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comienza en 3 simples pasos */}
      <section id="como-funciona" className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Comienza en </span>
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">3 simples pasos</span>
          </h2>
          
          <p className={`text-lg mb-16 max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Sin complicaciones. Empieza a practicar hoy mismo y ve resultados desde el primer día.
          </p>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold z-10">
                01
              </div>
              <div className={`p-8 rounded-2xl border-2 border-blue-500/30 ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <UserPlusIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Crea tu cuenta gratis
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Regístrate en segundos con Google o email. Sin tarjeta de crédito requerida para la prueba.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold z-10">
                02
              </div>
              <div className={`p-8 rounded-2xl border-2 border-blue-500/30 ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AdjustmentsHorizontalIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Elige tu camino
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Selecciona práctica de idiomas, desafíos de código, o ambos. Personaliza tu nivel y objetivos.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold z-10">
                03
              </div>
              <div className={`p-8 rounded-2xl border-2 border-blue-500/30 ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <TrophyIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Practica y crece
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Interactúa con tu AI coworker, recibe feedback y observa tu progreso diario.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prueba 7 días gratis */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className={`max-w-5xl mx-auto rounded-3xl border-2 border-blue-500/30 p-8 md:p-12 ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Left side */}
              <div>
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-600/20 px-4 py-2 rounded-full mb-6">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                    Oferta por tiempo limitado
                  </span>
                </div>

                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Prueba </span>
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">7 días gratis</span>
                </h2>
                
                <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Experimenta todo el poder de Praxtica sin compromiso. Si no te encanta, simplemente no continúes.
                </p>

                <button
                  onClick={() => setIsSignInModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center gap-2 mb-8"
                >
                  Comenzar prueba gratuita
                  <ArrowRightIcon className="w-5 h-5" />
                </button>

                <div className="flex flex-col sm:flex-row gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <ClockIcon className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                      7 días completos de acceso
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckIcon className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Sin tarjeta de crédito
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <CheckIcon className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Cancela cuando quieras
                  </span>
                </div>
              </div>

              {/* Right side */}
              <div>
                <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Incluido en tu prueba gratuita:
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckIcon className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Acceso completo a práctica de idiomas
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <CheckIcon className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Todos los desafíos de programación
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <CheckIcon className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      AI coworker ilimitado
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <CheckIcon className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Seguimiento de progreso personalizado
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <CheckIcon className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Sin límites de conversaciones
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <CheckIcon className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Soporte prioritario
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Lo que dicen </span>
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">nuestros usuarios</span>
          </h2>
          
          <p className={`text-lg mb-16 max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Miles de personas ya están mejorando sus habilidades con Praxtica
          </p>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Testimonio 1 - María García */}
            <div className={`p-6 rounded-2xl border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              {/* Stars */}
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIconSolid key={i} className="w-5 h-5 text-purple-500" />
                ))}
              </div>
              
              <p className={`text-sm mb-6 italic ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                "En 3 meses pasé de no poder mantener una conversación a hacer entrevistas en inglés con confianza. La AI se siente como un amigo paciente."
              </p>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  M
                </div>
                <div className="text-left">
                  <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    María García
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Estudiante de inglés
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonio 2 - Carlos Rodríguez */}
            <div className={`p-6 rounded-2xl border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              {/* Stars */}
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIconSolid key={i} className="w-5 h-5 text-purple-500" />
                ))}
              </div>
              
              <p className={`text-sm mb-6 italic ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                "Los desafíos de código son increíbles. No son ejercicios aburridos, son proyectos reales. El feedback del AI coworker es mejor que muchos code reviews que he recibido."
              </p>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  C
                </div>
                <div className="text-left">
                  <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Carlos Rodríguez
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Desarrollador Frontend
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonio 3 - Ana Martínez */}
            <div className={`p-6 rounded-2xl border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              {/* Stars */}
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIconSolid key={i} className="w-5 h-5 text-purple-500" />
                ))}
              </div>
              
              <p className={`text-sm mb-6 italic ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                "Uso Praxtica para mejorar mi español técnico y aprender Python al mismo tiempo. Es la combinación perfecta para mi carrera."
              </p>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  A
                </div>
                <div className="text-left">
                  <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Ana Martínez
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Product Manager
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonio 4 - Diego López */}
            <div className={`p-6 rounded-2xl border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              {/* Stars */}
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIconSolid key={i} className="w-5 h-5 text-purple-500" />
                ))}
              </div>
              
              <p className={`text-sm mb-6 italic ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                "Llevo 6 meses usando Praxtica para coding challenges. Mi velocidad resolviendo problemas ha mejorado muchísimo y ahora entiendo mejor los patrones de diseño."
              </p>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  D
                </div>
                <div className="text-left">
                  <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Diego López
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Backend Developer
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonio 5 - Laura Sánchez */}
            <div className={`p-6 rounded-2xl border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              {/* Stars */}
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIconSolid key={i} className="w-5 h-5 text-purple-500" />
                ))}
              </div>
              
              <p className={`text-sm mb-6 italic ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                "Recomiendo Praxtica a todos mis estudiantes. La práctica conversacional ilimitada complementa perfectamente las clases tradicionales."
              </p>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  L
                </div>
                <div className="text-left">
                  <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Laura Sánchez
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Profesora de idiomas
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonio 6 - Miguel Torres */}
            <div className={`p-6 rounded-2xl border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              {/* Stars */}
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIconSolid key={i} className="w-5 h-5 text-purple-500" />
                ))}
              </div>
              
              <p className={`text-sm mb-6 italic ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                "La función de AI coworker es genial. Es como hacer pair programming 24/7. Me ha ayudado a aprender React y TypeScript de forma práctica."
              </p>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  M
                </div>
                <div className="text-left">
                  <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Miguel Torres
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Full Stack Developer
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planes simples y transparentes */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Planes </span>
            <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-transparent bg-clip-text">simples y transparentes</span>
          </h2>
          
          <p className={`text-lg mb-8 max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Elige el plan que mejor se adapte a tus objetivos. Todos incluyen 7 días de prueba gratis.
          </p>

          <Link href="/plans">
            <button className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:via-blue-700 hover:to-cyan-700 transition-all duration-300 flex items-center justify-center gap-2 mx-auto mb-16">
              Ver todos los planes
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className={`px-4 ${isDarkMode ? 'bg-white' : 'bg-white'}`}>
        <div className="container mx-auto">
          <hr className={`border-t ${isDarkMode ? 'border-gray-200' : 'border-gray-200'}`} />
        </div>
      </div>

      {/* ¿Listo para empezar? */}
      <section className={`py-20 px-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-900'}`}>
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            ¿Listo para empezar?
          </h2>
          
          <p className="text-lg mb-8 max-w-2xl mx-auto text-gray-300">
            Únete a miles de personas que ya están mejorando sus habilidades con Praxtica
          </p>

          <button
            onClick={() => setIsSignInModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2 mx-auto"
          >
            Comienza tu prueba gratis
            <ArrowRightIcon className="w-5 h-5" />
          </button>
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

            <div className={`inline-block transform overflow-hidden rounded-lg text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:align-middle z-50 relative ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className={`text-lg font-medium leading-6 mb-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Iniciar Sesión
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => handleSignIn('github')}
                        disabled={isLoading}
                        className={`w-full flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600' 
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        className={`w-full flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600' 
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        className={`w-full flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${
                          isDarkMode 
                            ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600' 
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              <div className={`px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsSignInModalOpen(false)}
                  className={`inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                    isDarkMode 
                      ? 'bg-gray-600 text-white hover:bg-gray-500 focus:ring-gray-500' 
                      : 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500'
                  }`}
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
