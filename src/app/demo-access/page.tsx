'use client';

import { useEffect, useState } from 'react';
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

const DEMO_CHALLENGE_URL = '/english-practice/67fad33e9eb20c3dad132d05';

export default function DemoAccessPage() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [statusMessage, setStatusMessage] = useState('Activando acceso demo...');

  useEffect(() => {
    let isMounted = true;

    const activateDemoAccess = async () => {
      try {
        const result = await signIn('demo-access', {
          username: 'admin',
          password: 'admin',
          redirect: false,
        });

        if (!result?.ok) {
          if (isMounted) {
            setStatusMessage(result?.error || 'No fue posible iniciar la sesión demo.');
          }
          return;
        }

        const session = await getSession();

        if (session?.user?.isDemo) {
          router.replace(DEMO_CHALLENGE_URL);
          return;
        }

        if (isMounted) {
          setStatusMessage('La cuenta autenticada no tiene acceso demo.');
        }
      } catch (error) {
        console.error('Error activando acceso demo:', error);
        if (isMounted) {
          setStatusMessage('Ocurrió un error activando el acceso demo.');
        }
      }
    };

    activateDemoAccess();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <main className={`min-h-screen flex items-center justify-center px-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-3">Acceso Demo</h1>
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{statusMessage}</p>
      </div>
    </main>
  );
}
