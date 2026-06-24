import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pizarra Táctica Profesional - Estrategia de Fútbol',
  description: 'Diseña, graba y comparte tus tácticas de fútbol en tiempo real. Una pizarra táctica interactiva avanzada para entrenadores de fútbol profesional.',
  keywords: 'pizarra tactica, futbol, estrategia, entrenador, formaciones, tacticas, netlify, nextjs',
  authors: [{ name: 'Antigravity' }],
  manifest: '/manifest.json',
  themeColor: '#0a2e1e',
  icons: {
    apple: '/icon-180.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a2e1e',
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
