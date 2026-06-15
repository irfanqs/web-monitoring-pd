import type { Metadata } from 'next';
import '@fontsource/inter/latin.css';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'Monitoring Dashboard - Perjalanan Dinas',
  description: 'Sistem Monitoring Perjalanan Dinas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
