'use client';

import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';

export default function Plans() {
  const { isDarkMode } = useTheme();

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
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Plan Mensual */}
          <div className={`rounded-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
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
              className={`block w-full py-3 px-4 rounded-lg font-semibold text-center ${
                isDarkMode 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {getButtonProps('https://checkout.wompi.co/l/ysVnjr').text}
            </Link>
          </div>

          {/* Plan Anual */}
          <div className={`rounded-lg ${
            isDarkMode ? 'bg-gray-800 border-2 border-blue-500' : 'bg-white border-2 border-blue-500'
          } shadow-xl p-8 transform translate-y-[-1rem] transition-transform duration-300 hover:scale-105`}>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className={`px-3 py-1 text-sm rounded-full ${
                isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
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
                Una sorpresa
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
              className={`block w-full py-3 px-4 rounded-lg font-semibold text-center ${
                isDarkMode 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {getButtonProps('https://checkout.wompi.co/l/X1EkJt').text}
            </Link>
          </div>

          {/* Plan Empresarial */}
          <div className={`rounded-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-lg p-8 transition-transform duration-300 hover:scale-105`}>
            <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Plan Empresarial
            </h3>
            <div className="mb-6">
              <span className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                $2.500.000
              </span>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>/año</span>
            </div>
            <ul className={`mb-8 space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Todo lo del plan anual
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Hasta 5 desarrolladores
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Soporte 24/7
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Sesiones de mentoría
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Desafíos personalizados
              </li>
            </ul>
            <Link
              href={getButtonProps('https://checkout.wompi.co/l/JDguMv').href}
              className={`block w-full py-3 px-4 rounded-lg font-semibold text-center ${
                isDarkMode 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {getButtonProps('https://checkout.wompi.co/l/JDguMv').text}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 