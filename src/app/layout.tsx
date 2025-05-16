import './globals.css';
import type { Metadata } from 'next/dist/lib/metadata/types/metadata-interface';
import { Inter } from 'next/font/google';
import AuthProvider from '@/components/AuthProvider';
import { ThemeProvider } from '@/context/ThemeContext';
import ClientLayout from '@/components/ClientLayout';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import Clarity from '@/components/Clarity';
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Praxtica: Practica tus habilidades con desafíos avanzados',
  description: 'Una plataforma para aprender y practicar tus habilidades con desafíos avanzados',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <GoogleAnalytics />
        <Clarity />
        <AuthProvider>
          <ThemeProvider>
            <ClientLayout>{children}</ClientLayout>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
