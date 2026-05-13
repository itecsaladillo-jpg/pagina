import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'ITEC Saladillo — Ciencia, Tecnología y Comunidad',
    template: '%s | ITEC Saladillo',
  },
  description:
    'El ITEC Saladillo es una ONG de ciencia y tecnología de Saladillo, Buenos Aires. Capacitaciones, proyectos de innovación y vinculación comunitaria.',
  keywords: ['ITEC', 'ITEC Saladillo', 'ciencia', 'tecnología', 'ONG', 'Saladillo', 'innovación', 'capacitación'],
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'ITEC Saladillo',
    title: 'ITEC Saladillo — Ciencia, Tecnología y Comunidad',
    description: 'ONG de ciencia y tecnología en Saladillo, Buenos Aires.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={inter.variable} data-scroll-behavior="smooth">
      <body className="font-[var(--font-inter)]">{children}</body>
    </html>
  )
}
