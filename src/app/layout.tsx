import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { LanguageProvider } from '@/contexts/LanguageContext'
import './globals.css'
import ChatWidgetWrapper from '@/components/chat/ChatWidgetWrapper'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap', // previene flash
})

export const metadata: Metadata = {
  title: {
    default: 'ITEC Saladillo — Ciencia, Tecnología y Comunidad',
    template: '%s | ITEC Saladillo',
  },
  description:
    'ITEC Saladillo es una ONG de ciencia y tecnología de Saladillo, Buenos Aires. Capacitaciones, proyectos de innovación y vinculación comunitaria.',
  keywords: ['ITEC', 'ITEC Saladillo', 'ciencia', 'tecnología', 'ONG', 'Saladillo', 'innovación', 'capacitación'],
  icons: {
    icon: [
      { url: '/favicon-32x32.png?v=4', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png?v=4', sizes: '16x16', type: 'image/png' },
      { url: '/icon.png?v=4', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico?v=4', sizes: 'any' },
    ],
    shortcut: '/favicon-32x32.png?v=4',
    apple: [
      { url: '/apple-icon.png?v=4', sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon.png?v=4', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'ITEC Saladillo',
    title: 'ITEC Saladillo — Ciencia, Tecnología y Comunidad',
    description: 'ONG de ciencia y tecnología en Saladillo, Buenos Aires.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#09090b',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon-32x32.png?v=4" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon-16x16.png?v=4" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon.ico?v=4" sizes="any" />
        <link rel="shortcut icon" href="/favicon-32x32.png?v=4" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=4" sizes="180x180" />
      </head>
      <body className="font-[var(--font-inter)]">
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <ChatWidgetWrapper />
      </body>
    </html>
  )
}
