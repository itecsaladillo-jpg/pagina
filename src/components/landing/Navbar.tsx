'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const navLinks = [
  { label: 'Nosotros', href: '/#nosotros' },
  { label: 'Comisiones', href: '/#comisiones' },
  { label: 'Acciones', href: '/acciones' },
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
      className={`sticky top-0 z-50 transition-all duration-300 border-b border-[var(--border-subtle)] ${
        scrolled ? 'py-[7px]' : 'py-[15px]'
      }`}
      style={{
        background: 'radial-gradient(circle at 100px 100%, #17338c 0%, #000000 100%)'
      }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="group relative">
          {/* Iluminación puntual debajo del logo */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-24 h-10 bg-[#3b82f6] blur-[40px] opacity-50 -z-10 rounded-full" />
          
          <Image
            src="/logoitectrans.png"
            alt="ITEC Augusto Cicaré"
            width={140}
            height={52}
            className="h-10 w-auto object-contain group-hover:opacity-90 transition-opacity relative z-10"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="btn-outline text-[10px] uppercase tracking-wider py-1.5 px-4 border-dashed opacity-70 hover:opacity-100 transition-all"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="btn-outline text-xs py-2 px-5 group/btn">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            <span>Acceso Miembros</span>
          </Link>
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
          <Link href="/login" className="btn-outline text-xs py-2 px-5 w-fit">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            <span>Acceso Miembros</span>
          </Link>
        </div>
      )}
    </nav>
  )
}
