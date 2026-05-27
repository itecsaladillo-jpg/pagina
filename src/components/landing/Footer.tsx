'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/contexts/LanguageContext'

export function Footer() {
  const { dict } = useLanguage()
  return (
    <footer className="border-t border-[var(--border-subtle)] py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="cursor-pointer">
              <Image
                src="/logoitectrans_v2.png"
                alt="ITEC Saladillo"
                width={110}
                height={42}
                className="h-8 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
              />
            </Link>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
            <a href="#nosotros" className="hover:text-[var(--accent-cyan-2)] transition-colors">{dict.navbar.nosotros}</a>
            <a href="#comisiones" className="hover:text-[var(--accent-cyan-2)] transition-colors">{dict.navbar.acciones}</a>
            <a href="#acciones" className="hover:text-[var(--accent-cyan-2)] transition-colors">{dict.navbar.acciones}</a>
            <a href="#ideas" className="hover:text-[var(--accent-cyan-2)] transition-colors">{dict.navbar.ideas}</a>
            <Link href="/mapa-productivo" className="hover:text-blue-300 transition-colors font-medium">{dict.navbar.mapa}</Link>
          </div>

          {/* Login */}
          <Link href="/login" className="btn-outline text-sm py-2 px-5">
            {dict.navbar.miembros}
          </Link>
        </div>

        {/* Card Mapa Productivo */}
        <div className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🗺️</span>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">{dict.registroMapa.empresaForm.subtitle.split('para')[0]}</p>
              <p className="text-xs text-[var(--text-secondary)]">{dict.registroMapa.desc}</p>
            </div>
          </div>
          <Link
            href="/mapa-productivo"
            className="flex-shrink-0 text-xs font-bold px-5 py-2.5 rounded-full
              bg-gradient-to-r from-blue-600 to-cyan-600 text-white
              hover:shadow-[0_4px_20px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-200"
          >
            {dict.footer.verMapa} →
          </Link>
        </div>

        <div className="section-divider my-8" />

        <p className="text-center text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} ITEC Saladillo — {dict.footer.legal.split('© 2026 ITEC Saladillo.').slice(1).join('') || 'Todos los derechos reservados.'}
        </p>
      </div>
    </footer>
  )
}
