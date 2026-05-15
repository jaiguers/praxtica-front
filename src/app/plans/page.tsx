'use client';

import { useTheme } from '@/context/ThemeContext';
import { Plan, PlanType, planService } from '@/services/planService';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';

const planOrder: Record<PlanType, number> = {
  free: 1,
  monthly: 2,
  annual: 3,
  enterprise: 4,
};

const planDescriptions: Record<PlanType, string> = {
  free: 'Perfecto para empezar',
  monthly: 'Para aprendizaje serio',
  annual: 'Para no limitarse',
  enterprise: 'Para equipos y organizaciones',
};

const planPeriods: Record<PlanType, string> = {
  free: '/mes',
  monthly: '/mes',
  annual: '/año',
  enterprise: '',
};

const faqs = [
  {
    question: '¿Cómo funciona la prueba gratuita de 7 días?',
    answer: 'Puedes acceder a todas las funciones del plan Pro durante 7 días sin costo. No se requiere tarjeta de crédito para comenzar. Al finalizar el período de prueba, puedes elegir continuar con un plan pago o seguir usando la versión gratuita.',
  },
  {
    question: '¿Qué idiomas puedo practicar?',
    answer: 'Actualmente ofrecemos práctica en inglés y español, con conversaciones naturales con IA. Estamos trabajando en agregar más idiomas como francés, alemán, italiano y portugués en futuras actualizaciones.',
  },
  {
    question: '¿Qué lenguajes de programación soportan?',
    answer: 'Soportamos los lenguajes más populares incluyendo JavaScript, Python, Java, C++, C#, Go, Rust, TypeScript, PHP, Ruby y muchos más. Nuestros desafíos cubren desde conceptos básicos hasta algoritmos avanzados.',
  },
  {
    question: '¿El AI realmente me ayuda a mejorar?',
    answer: 'Sí, nuestro AI está diseñado específicamente para el aprendizaje. Proporciona retroalimentación personalizada, se adapta a tu nivel, corrige errores en tiempo real y te guía paso a paso.',
  },
  {
    question: '¿Cómo es diferente de otras apps de idiomas o coding?',
    answer: 'Praxtica combina lo mejor de ambos mundos en una sola plataforma. Además, nuestro AI no es un simple bot: es un coworker que se adapta a ti, recuerda tu progreso y te desafía de forma personalizada.',
  },
  {
    question: '¿Puedo usar Praxtica en mi teléfono?',
    answer: 'Sí, nuestra plataforma es completamente responsive y funciona perfectamente en dispositivos móviles.',
  },
];

const formatPlanPrice = (price: number) => {
  if (price === 0) return '$0';

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(price);
};

export default function Plans() {
  const { isDarkMode } = useTheme();
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'github' | 'google' | ''>('');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isPlansLoading, setIsPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsPlansLoading(true);
        setPlansError('');

        const response = await planService.getPlans();
        const activePlans = response
          .filter((plan) => plan.active)
          .sort((a, b) => planOrder[a.type] - planOrder[b.type]);

        setPlans(activePlans);
      } catch (error) {
        console.error('Error fetching plans:', error);
        setPlansError('No pudimos cargar los planes en este momento.');
      } finally {
        setIsPlansLoading(false);
      }
    };

    fetchPlans();
  }, []);

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

  const renderPlanAction = (plan: Plan) => {
    if (plan.type === 'free') {
      return (
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
      );
    }

    if (plan.type === 'monthly') {
      return (
        <Link
          href="https://checkout.wompi.co/l/ysVnjr"
          className="block w-full py-3 px-4 rounded-lg font-semibold text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all"
        >
          Empezar
        </Link>
      );
    }

    return (
      <button
        className={`w-full py-3 px-4 rounded-lg font-semibold text-center transition-colors ${
          isDarkMode
            ? 'bg-gray-700 text-white hover:bg-gray-600'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
      >
        {plan.type === 'enterprise' ? 'Contactar Ventas' : 'Comprar Ahora'}
      </button>
    );
  };

  return (
    <div className={`min-h-screen py-24 relative overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/10 to-transparent rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Planes <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-transparent bg-clip-text">simples y transparentes</span>
          </h1>
          <p className={`text-lg max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Elige el plan que mejor se adapte a tus objetivos. Todos incluyen 7 días de prueba gratis.
          </p>
        </div>

        {isPlansLoading ? (
          <div className="grid gap-8 max-w-6xl mx-auto md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className={`h-[520px] rounded-2xl border animate-pulse ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-lg'
                }`}
              />
            ))}
          </div>
        ) : plansError ? (
          <div
            className={`max-w-2xl mx-auto rounded-xl border p-6 text-center ${
              isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600 shadow-sm'
            }`}
          >
            {plansError}
          </div>
        ) : (
          <div className="grid gap-8 max-w-6xl mx-auto md:grid-cols-3">
            {plans.map((plan) => {
              const isPopular = plan.type === 'monthly';
              const cardClassName = isPopular
                ? `rounded-2xl border-2 border-purple-500 p-8 relative transform md:scale-105 shadow-2xl shadow-purple-500/50 glow-effect ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white light-mode'
                  }`
                : `rounded-2xl border p-8 relative ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-lg'
                  }`;

              return (
                <div key={plan._id} className={cardClassName}>
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 text-sm rounded-full font-medium">
                        Más popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {plan.title}
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {planDescriptions[plan.type]}
                    </p>
                  </div>

                  <div className="text-center mb-8">
                    <span className={`text-5xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatPlanPrice(plan.price)}
                    </span>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {planPeriods[plan.type]}
                    </span>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.items.map((item) => (
                      <li key={item} className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <CheckIcon className={`w-5 h-5 mr-3 flex-shrink-0 ${isPopular ? 'text-purple-500' : 'text-green-500'}`} />
                        {item}
                      </li>
                    ))}
                  </ul>

                  {renderPlanAction(plan)}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-24 max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Preguntas <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-transparent bg-clip-text">frecuentes</span>
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              ¿Tienes dudas? Aquí respondemos las preguntas más comunes
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={faq.question}
                className={`rounded-xl border transition-all duration-200 ${
                  isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
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
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {isSignInModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity z-40" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" />
            </div>

            <div className={`w-full max-w-md rounded-lg text-left shadow-xl z-50 relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="px-6 pt-6 pb-4">
                <h3 className={`text-lg font-medium leading-6 mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Iniciar Sesión
                </h3>
                <div className="space-y-3">
                  {(['github', 'google'] as const).map((provider) => (
                    <button
                      key={provider}
                      onClick={() => handleSignIn(provider)}
                      disabled={isLoading}
                      className={`w-full flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${
                        isDarkMode
                          ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {loadingProvider === provider
                        ? 'Iniciando sesión...'
                        : `Iniciar Sesión con ${provider === 'github' ? 'GitHub' : 'Google'}`}
                    </button>
                  ))}
                </div>
              </div>
              <div className={`px-6 py-3 flex justify-end ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <button
                  type="button"
                  onClick={() => setIsSignInModalOpen(false)}
                  className={`rounded-md px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
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
