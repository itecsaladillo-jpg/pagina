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
    default: 'ITEC Augusto Cicaré — Ciencia, Tecnología y Comunidad',
    template: '%s | ITEC Augusto Cicaré',
  },
  description:
    'El ITEC Augusto Cicaré es una ONG de ciencia y tecnología de Saladillo, Buenos Aires. Capacitaciones, proyectos de innovación y vinculación comunitaria.',
  keywords: ['ITEC', 'Augusto Cicaré', 'ciencia', 'tecnología', 'ONG', 'Saladillo', 'innovación', 'capacitación'],
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'ITEC Augusto Cicaré',
    title: 'ITEC Augusto Cicaré — Ciencia, Tecnología y Comunidad',
    description: 'ONG de ciencia y tecnología en Saladillo, Buenos Aires.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-[var(--font-inter)]">{children}</body>
    </html>
  )
}
