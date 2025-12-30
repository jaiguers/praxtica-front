'use client';

import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export default function Plans() {
  const { isDarkMode } = useTheme();
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string>('');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

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

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs = [
    {
      question: "¿Cómo funciona la prueba gratuita de 7 días?",
      answer: "Puedes acceder a todas las funciones del plan Pro durante 7 días sin costo. No se requiere tarjeta de crédito para comenzar. Al finalizar el período de prueba, puedes elegir continuar con un plan pago o seguir usando la versión gratuita."
    },
    {
      question: "¿Qué idiomas puedo practicar?",
      answer: "Actualmente ofrecemos práctica en inglés y español, con conversaciones naturales con IA. Estamos trabajando en agregar más idiomas como francés, alemán, italiano y portugués en futuras actualizaciones."
    },
    {
      question: "¿Qué lenguajes de programación soportan?",
      answer: "Soportamos los lenguajes más populares incluyendo JavaScript, Python, Java, C++, C#, Go, Rust, TypeScript, PHP, Ruby y muchos más. Nuestros desafíos cubren desde conceptos básicos hasta algoritmos avanzados."
    },
    {
      question: "¿El AI realmente me ayuda a mejorar?",
      answer: "Sí, nuestro AI está diseñado específicamente para el aprendizaje. Proporciona retroalimentación personalizada, se adapta a tu nivel, corrige errores en tiempo real y te guía paso a paso. Miles de usuarios han mejorado significativamente sus habilidades."
    },
    {
      question: "¿Cómo es diferente de otras apps de idiomas o coding?",
      answer: "Praxtica combina lo mejor de ambos mundos en una sola plataforma. Además, nuestro AI no es un simple bot: es un coworker que se adapta a ti, recuerda tu progreso, y te desafía de forma personalizada."
    },
    {
      question: "¿Puedo usar Practica en mi teléfono?",
      answer: "Sí, nuestra plataforma es completamente responsive y funciona perfectamente en dispositivos móviles. También estamos desarrollando aplicaciones nativas para iOS y Android que estarán disponibles próximamente."
    }
  ];

  return (
    <div className={`min-h-screen py-24 relative overflow-hidden ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/10 to-transparent rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Encabezado */}
        <div className="text-center mb-16">
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Planes <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-transparent bg-clip-text">simples y transparentes</span>
          </h1>
          <p className={`text-lg max-w-3xl mx-auto ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Elige el plan que mejor se adapte a tus objetivos. Todos incluyen 7 días de prueba gratis.
          </p>
        </div>

        {/* Planes */}
        <div className="grid gap-8 max-w-6xl mx-auto md:grid-cols-3">
          
          {/* Plan Gratuito */}
          <div className={`rounded-2xl border p-8 relative ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200 shadow-lg'
          }`}>
            <div className="text-center mb-6">
              <h3 className={`text-2xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Gratuito</h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Perfecto para empezar</p>
            </div>
            
            <div className="text-center mb-8">
              <span className={`text-5xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>$0</span>
              <span className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>/mes</span>
            </div>

            <ul className="space-y-4 mb-8">
              <li className={`flex items-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <CheckIcon className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                Práctica de idiomas
              </li>
              <li className={`flex items-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <CheckIcon className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                Todos los desafíos de programación
              </li>
              <li className={`flex items-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <CheckIcon className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                AI coworker
              </li>
              <li className={`flex items-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <CheckIcon className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                Seguimiento de progreso
              </li>
              <li className={`flex items-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <CheckIcon className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                Comunidad de usuarios
              </li>
            </ul>

            <button
              onClick={() => setIsSignInModalOpen(true)}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-center transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 text-white hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              Empezar Gratis
            </button>
          </div>

          {/* Plan Mensual - Más Popular */}
          <div className={`rounded-2xl border-2 border-purple-500 p-8 relative transform scale-105 shadow-2xl shadow-purple-500/50 glow-effect ${
            isDarkMode ? 'bg-gray-800' : 'bg-white light-mode'
          }`}>
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 text-sm rounded-full font-medium">
                ✨ Más popular
              </span>
            </div>
            
            <div className="text-center mb-6">
              <h3 className={`text-2xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Mensual</h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Para aprendizaje serio</p>
            </div>
            
            <div className="text-center mb-8">
              <span className={`text-5xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>$45.000</span>
              <span className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>/mes</span>
            </div>

            <ul className="space-y-4 mb-8">
              <li className={`flex items-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <CheckIcon className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0" />
                Práctica de idiomas ilimitada
              </li>
              <li className={`flex items-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <CheckIcon className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0" />
                Desafíos de código ilimitados
              </li>
              <li className={`flex items-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <CheckIcon className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0" />
                AI coworker avanzado
              </li>
              <li className={`flex items-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <CheckIcon className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0" />
                Análisis detallado de progreso
              </li>
              <li className={`flex items-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <CheckIcon className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0" />
                Escenarios personalizados
              </li>
              <li className={`flex items-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <CheckIcon className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0" />
                Soporte prioritario
              </li>
            </ul>

            <Link
              href="https://checkout.wompi.co/l/ysVnjr"
              className="block w-full py-3 px-4 rounded-lg font-semibold text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              Empezar
            </Link>
          </div>

          {/* Plan Anual */}
          <div className={`rounded-2xl border p-8 relative ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200 shadow-lg'
          }`}>
            <div className="text-center mb-6">
              <h3 className={`text-2xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Anual</h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Para no limitarse</p>
            </div>
            
            <div className="text-center mb-8">
              <span className={`text-5xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>$500.000</span>
              <span className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>/año</span>
            </div>

            <ul className="space-y-4 mb-8">
              <li className={`flex items-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <CheckIcon className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                Todo del plan mensual
              </li>
              <li className={`flex items-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <CheckIcon className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                Panel de administración
              </li>
              <li className={`flex items-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <CheckIcon className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                Reportes de equipo
              </li>
              <li className={`flex items-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <CheckIcon className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                Contenido personalizado
              </li>
              <li className={`flex items-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <CheckIcon className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                Facturación centralizada
              </li>
            </ul>

            <button className={`w-full py-3 px-4 rounded-lg font-semibold text-center transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 text-white hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}>
              Comprar Ahora
            </button>
          </div>
        </div>

        {/* Sección de Preguntas Frecuentes */}
        <div className="mt-24 max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Preguntas <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-transparent bg-clip-text">frecuentes</span>
            </h2>
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              ¿Tienes dudas? Aquí respondemos las preguntas más comunes
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`rounded-xl border transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                    : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className={`w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  <span className="font-semibold text-lg pr-4">{faq.question}</span>
                  <ChevronDownIcon 
                    className={`w-5 h-5 transition-transform duration-200 flex-shrink-0 ${
                      openFAQ === index ? 'transform rotate-180' : ''
                    } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  />
                </button>
                {openFAQ === index && (
                  <div className="px-6 pb-5">
                    <p className={`${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    } leading-relaxed`}>
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
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