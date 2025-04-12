'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Error de autenticación
          </h2>
          <p className="mt-2 text-center text-sm text-red-600">
            {error === 'AccessDenied'
              ? 'No tienes permiso para acceder a esta aplicación.'
              : 'Ocurrió un error durante la autenticación.'}
          </p>
        </div>
        <div className="text-center">
          <Link
            href="/auth/signin"
            className="text-blue-600 hover:text-blue-800"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
} 