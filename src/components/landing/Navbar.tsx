'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const navLinks = [
  { label: 'Acciones', href: '/#acciones' },
  { label: 'Videoteca', href: '/#videoteca' },
  { label: 'Nosotros', href: '/#nosotros' },
  { label: 'Sponsors', href: '/#sponsors' },
  { label: 'Buzón de Ideas', href: '/#ideas' },
  { label: 'Acceso Miembros', href: '/login' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 border-b border-[var(--border-subtle)] flex items-center ${
        scrolled ? 'h-16' : 'h-20'
      }`}
      style={{
        background: scrolled 
          ? 'radial-gradient(circle at 100px 100%, #17338c 0%, #000000 100%)' 
          : 'transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none'
      }}
    >
      <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-12">
          {/* Logo */}
          <Link href="/" className="group relative">
            {/* Iluminación puntual debajo del logo */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-24 h-10 bg-[#3b82f6] blur-[40px] opacity-50 -z-10 rounded-full" />
            
            <Image
              src="/logoitectrans_v2.png"
              alt="ITEC Saladillo"
              width={140}
              height={52}
              className="h-10 w-auto object-contain group-hover:opacity-90 transition-opacity relative z-10"
              priority
            />
          </Link>

          {/* Desktop nav — Izquierda (Primeros 5) */}
          <div className="hidden md:flex items-center gap-2 ml-[200px]">
            {navLinks.slice(0, 5).map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="btn-outline text-[10px] uppercase tracking-wider py-1.5 px-4 border-dashed opacity-70 hover:opacity-100 transition-all"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Desktop nav — Derecha (Acceso Miembros) */}
        <div className="hidden md:flex items-center">
          <a
            href={navLinks[5].href}
            className="btn-outline text-[10px] uppercase tracking-wider py-1.5 px-4 border-dashed opacity-70 hover:opacity-100 transition-all"
          >
            {navLinks[5].label}
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-[var(--text-secondary)] hover:text-white transition-colors"
          aria-label="Menú"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden glass border-t border-[var(--border-subtle)] mt-3 px-6 py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="btn-outline text-xs py-2 px-4 w-full justify-center"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}
