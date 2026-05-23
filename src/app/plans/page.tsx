'use client';

import { useTheme } from '@/context/ThemeContext';
import { Plan, PlanType, planService } from '@/services/planService';
import { fetchWithAuth } from '@/services/api';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Script from 'next/script';
import { signIn, useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';

declare global {
  interface Window {
    WidgetCheckout?: new (config: WompiCheckoutConfig) => {
      open: (callback: (result: WompiCheckoutResult) => void) => void;
    };
  }
}

interface WompiCheckoutConfig {
  currency: string;
  amountInCents: number;
  reference: string;
  publicKey: string;
  signature: {
    integrity: string;
  };
  redirectUrl: string;
  customerData: {
    email?: string | null;
    fullName?: string | null;
  };
}

// Interfaces para los tipos de Wompi
interface WompiPaymentMethod {
  type?: string;
  phoneNumber?: string;
  legal_id?: string;
  legal_id_type?: string;
}

interface WompiTransaction {
  id: string;
  status: string;
  paymentMethodType?: string;
  paymentMethod?: WompiPaymentMethod;
  customerNumberPrefix?: string;
  extra?: {
    externalIdentifier?: string;
    transactionId?: string;
  };
}

interface WompiCheckoutResult {
  transaction: WompiTransaction;
}

const PENDING_WOMPI_PLAN_ID = 'praxtica_pending_wompi_plan_id';

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
  const { data: session, status } = useSession();
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'github' | 'google' | ''>('');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isPlansLoading, setIsPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [pendingCheckoutPlanId, setPendingCheckoutPlanId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [isWompiReady, setIsWompiReady] = useState(false);

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
      const callbackUrl = pendingCheckoutPlanId
        ? `/plans?checkoutPlanId=${encodeURIComponent(pendingCheckoutPlanId)}`
        : '/dashboard';

      await signIn(provider, { callbackUrl });
    } catch (error) {
      console.error('Error during sign in:', error);
      setIsLoading(false);
      setLoadingProvider('');
    }
  };

  const handlePaidPlanSelection = useCallback(async (plan: Plan) => {
    if (status !== 'authenticated' || !session?.user?.token) {
      localStorage.setItem(PENDING_WOMPI_PLAN_ID, plan._id);
      setPendingCheckoutPlanId(plan._id);
      setPaymentError('');
      setIsSignInModalOpen(true);
      return;
    }

    if (!window.WidgetCheckout) {
      setPaymentError('El checkout de Wompi todavia se esta cargando. Intenta nuevamente en unos segundos.');
      return;
    }

    const currency = 'COP';
    const amountInCents = Math.round(plan.price * 100);
    const reference = `plan-${plan._id}-${Date.now()}`;

    try {
      setPaymentError('');
      setSelectedPlanId(plan._id);

      const signatureResponse = await fetch('/api/wompi/integrity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference,
          amountInCents,
          currency,
        }),
      });

      if (!signatureResponse.ok) {
        throw new Error('No pudimos preparar el pago con Wompi.');
      }

      const { integrity, publicKey } = await signatureResponse.json();

      console.log('Wompi integrity hash:', integrity, 'Currency:', currency, 'Amount in Cents:', amountInCents, 'Reference:', reference);

      // Crear instancia del checkout
      const checkout = new window.WidgetCheckout({
        currency: currency,
        amountInCents: amountInCents,
        reference: reference,
        publicKey: publicKey,
        signature: {
          integrity: integrity
        },
        redirectUrl: `${window.location.origin}/dashboard/thanks`,
        customerData: {
          email: session.user.email,
          fullName: session.user.name,
        },
      });

      checkout.open(async (result: WompiCheckoutResult) => {
        const transaction = result.transaction;

        if (transaction?.status !== 'APPROVED') {
          setSelectedPlanId(null);
          return;
        }

        try {
          if (!transaction.id) {
            throw new Error('Wompi did not return a transaction ID.');
          }

          const verificationResponse = await fetch(`/api/wompi/transactions/${transaction.id}`);

          if (!verificationResponse.ok) {
            throw new Error('No pudimos verificar la transaccion con Wompi.');
          }

          const verifiedTransaction = await verificationResponse.json();

          if (
            verifiedTransaction.status !== 'APPROVED' ||
            verifiedTransaction.amountInCents !== amountInCents ||
            verifiedTransaction.currency !== currency ||
            verifiedTransaction.reference !== reference
          ) {
            throw new Error('La transaccion verificada no coincide con el pago solicitado.');
          }

          await fetchWithAuth('/payments', {
            method: 'POST',
            body: JSON.stringify({
              planId: plan._id,
              paymentMethod: 'wompi',
              amount: plan.price,
              currency,
              transactionId: verifiedTransaction.id,
            }),
          });
        } catch (error) {
          console.error('Error registering payment:', error);
          setPaymentError('El pago fue aprobado, pero no pudimos registrarlo. Contacta soporte con el ID de transaccion.');
        } finally {
          setSelectedPlanId(null);
        }
      });
    } catch (error) {
      console.error('Error opening Wompi checkout:', error);
      setPaymentError(error instanceof Error ? error.message : 'No pudimos iniciar el pago.');
      setSelectedPlanId(null);
    }
  }, [session?.user?.email, session?.user?.name, session?.user?.token, status]);

  useEffect(() => {
    if (status !== 'authenticated' || isPlansLoading || !isWompiReady || plans.length === 0) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const checkoutPlanId = params.get('checkoutPlanId') || localStorage.getItem(PENDING_WOMPI_PLAN_ID);

    if (!checkoutPlanId || selectedPlanId === checkoutPlanId) {
      return;
    }

    const plan = plans.find((item) => item._id === checkoutPlanId && item.type !== 'free' && item.price > 0);

    localStorage.removeItem(PENDING_WOMPI_PLAN_ID);
    setPendingCheckoutPlanId(null);

    if (params.has('checkoutPlanId')) {
      window.history.replaceState(null, '', '/plans');
    }

    if (plan) {
      handlePaidPlanSelection(plan);
    }
  }, [status, isPlansLoading, isWompiReady, plans, selectedPlanId, handlePaidPlanSelection]);

  const renderPlanAction = (plan: Plan) => {
    if (plan.type === 'free' || plan.price <= 0) {
      return (
        <button
          onClick={() => setIsSignInModalOpen(true)}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-center transition-colors ${isDarkMode
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
        >
          Empezar Gratis
        </button>
      );
    }

    return (
      <button
        onClick={() => handlePaidPlanSelection(plan)}
        disabled={selectedPlanId === plan._id}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-center transition-colors ${plan.type === 'monthly'
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
            : isDarkMode
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          } ${selectedPlanId === plan._id ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {selectedPlanId === plan._id ? 'Abriendo checkout...' : plan.type === 'enterprise' ? 'Contactar Ventas' : 'Comprar Ahora'}
      </button>
    );
  };

  return (
    <div className={`min-h-screen py-24 relative overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Script
        src="https://checkout.wompi.co/widget.js"
        strategy="afterInteractive"
        onReady={() => setIsWompiReady(true)}
      />
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
                className={`h-[520px] rounded-2xl border animate-pulse ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-lg'
                  }`}
              />
            ))}
          </div>
        ) : plansError ? (
          <div
            className={`max-w-2xl mx-auto rounded-xl border p-6 text-center ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600 shadow-sm'
              }`}
          >
            {plansError}
          </div>
        ) : (
          <div className="grid gap-8 max-w-6xl mx-auto md:grid-cols-3">
            {plans.map((plan) => {
              const isPopular = plan.type === 'monthly';
              const cardClassName = isPopular
                ? `rounded-2xl border-2 border-purple-500 p-8 relative transform md:scale-105 shadow-2xl shadow-purple-500/50 glow-effect ${isDarkMode ? 'bg-gray-800' : 'bg-white light-mode'
                }`
                : `rounded-2xl border p-8 relative ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-lg'
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

        {paymentError && (
          <div
            className={`mt-8 max-w-2xl mx-auto rounded-xl border p-4 text-center ${isDarkMode ? 'bg-red-950/30 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-700'
              }`}
          >
            {paymentError}
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
                className={`rounded-xl border transition-all duration-200 ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                  }`}
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className={`w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none ${isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                >
                  <span className="font-semibold text-lg pr-4">{faq.question}</span>
                  <ChevronDownIcon
                    className={`w-5 h-5 transition-transform duration-200 flex-shrink-0 ${openFAQ === index ? 'transform rotate-180' : ''
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
                      className={`w-full flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${isDarkMode
                          ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {loadingProvider === provider ? (
                        <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : provider === 'github' ? (
                        <svg className="h-5 w-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      )}
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
                  className={`rounded-md px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDarkMode
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
