'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/contexts/LanguageContext'
import { MembersAccessButton } from '@/components/auth/MembersAccessButton'

const navLinks = [
  { label: 'Acciones', href: '/#acciones' },
  { label: 'Videoteca', href: '/#videoteca' },
  { label: 'Nosotros', href: '/#nosotros' },
  { label: 'Sponsors', href: '/#sponsors' },
  { label: 'Buzón de Ideas', href: '/#ideas' },
  { label: 'Mapa Productivo', href: '/mapa-productivo', highlight: true },
  { label: 'Acceso Miembros', href: '/login' },
]

export function Navbar() {
  const { language, dict } = useLanguage()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [claseEnVivo, setClaseEnVivo] = useState(false)
  const pathname = usePathname()

  const dynamicLinks = [
    { label: dict.navbar.acciones, href: '/#acciones' },
    { label: dict.navbar.videoteca, href: '/#videoteca' },
    { label: dict.navbar.nosotros, href: '/#nosotros' },
    { label: dict.navbar.sponsors, href: '/#sponsors' },
    { label: dict.navbar.ideas, href: '/#ideas' },
    { label: dict.navbar.mapa, href: '/mapa-productivo', highlight: true },
    { label: dict.navbar.miembros, href: '/login' },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const checkClaseEnVivo = async () => {
      try {
        const { data, error } = await supabase
          .from('clases_virtuales')
          .select('id')
          .eq('en_vivo', true)
          .limit(1)

        if (!error && data && data.length > 0) {
          setClaseEnVivo(true)
        } else {
          setClaseEnVivo(false)
        }
      } catch (err) {
        console.error('Error al comprobar clase en vivo:', err)
      }
    }

    checkClaseEnVivo()

    const channel = supabase
      .channel('clases_en_vivo_navbar')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clases_virtuales'
        },
        () => {
          checkClaseEnVivo()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])


  const isHome = pathname === '/'
  const showSolidNavbar = !isHome || scrolled

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 border-b border-[var(--border-subtle)] flex items-center ${
        showSolidNavbar ? 'h-20' : 'h-24'
      }`}
      style={{
        background: showSolidNavbar 
          ? 'radial-gradient(circle at 100px 100%, #17338c 0%, #000000 100%)' 
          : 'transparent',
        backdropFilter: showSolidNavbar ? 'blur(10px)' : 'none'
      }}
    >
      <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="group relative shrink-0 block">
          {/* Iluminación puntual debajo del logo */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-20 h-8 bg-[#3b82f6] blur-[30px] opacity-40 -z-10 rounded-full" />
          
          <Image
            src="/logoitectrans_v2.png"
            alt="ITEC Saladillo"
            width={200}
            height={76}
            className={`w-auto object-contain group-hover:opacity-90 transition-all duration-300 relative z-10 shrink-0 ${
              showSolidNavbar ? 'h-[42px]' : 'h-[54px]'
            }`}
            priority
            loading="eager"
          />
        </Link>

        {/* Desktop nav — Unificado y alineado a la derecha */}
        <div className="hidden lg:flex items-center gap-1.5 ml-auto shrink-0">
          {/* Primeros 5 enlaces */}
          {dynamicLinks.slice(0, 5).map((link) => {
            return (
              <a
                key={link.href}
                href={link.href}
                className="text-[9px] uppercase tracking-wider px-1.5 opacity-75 hover:opacity-100 hover:text-blue-400 transition-all flex items-center justify-center text-center leading-[1.15] whitespace-normal shrink-0 w-auto"
              >
                <span>
                  {link.label.split('\n').map((line, i) => (
                    <span key={i} className="block whitespace-nowrap">
                      {line}
                    </span>
                  ))}
                </span>
              </a>
            )
          })}
          
          {/* Mapa Productivo — destacado */}
          <a
            href="/mapa-productivo"
            className="text-[9px] uppercase tracking-wider py-0.5 px-2 rounded-full font-extrabold
              bg-gradient-to-r from-blue-600/30 to-cyan-600/20 border border-blue-500/40
              text-blue-300 hover:text-white hover:border-blue-400 hover:from-blue-600/50 hover:to-cyan-600/30
              transition-all duration-200 flex items-center justify-center gap-1.5 text-center w-auto whitespace-normal leading-[1.15] shrink-0"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
            <span>{dict.navbar.mapa}</span>
          </a>
 
          {/* Aula Virtual */}
          {claseEnVivo ? (
            <Link
              href="/clases/demostracion"
              className="text-[9px] uppercase tracking-wider py-0.5 px-2 rounded-full font-extrabold
                bg-gradient-to-r from-red-600/30 to-rose-600/20 border border-red-500/40
                text-red-300 hover:text-white hover:border-red-400 hover:from-red-600/50 hover:to-rose-600/30
                transition-all duration-200 flex items-center justify-center gap-1.5 text-center w-auto whitespace-normal leading-[1.15] shrink-0 animate-pulse"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
              <span>{dict.navbar.aula}</span>
            </Link>
          ) : (
            <Link
              href="/clases/demostracion"
              className="text-[9px] uppercase tracking-wider px-1.5 opacity-75 hover:opacity-100 hover:text-blue-400 transition-all flex items-center justify-center text-center w-auto whitespace-normal leading-[1.15] shrink-0"
            >
              <span>{dict.navbar.aula}</span>
            </Link>
          )}
 
          {/* Acceso Miembros — dispara OAuth directo sin pasar por /login */}
          <MembersAccessButton
            className="text-[9px] uppercase tracking-wider px-1.5 opacity-75 hover:opacity-100 hover:text-blue-400 transition-all flex items-center justify-center text-center w-auto whitespace-normal leading-[1.15] shrink-0 bg-transparent border-none cursor-pointer"
          >
            <span>{dynamicLinks[6].label}</span>
          </MembersAccessButton>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden text-[var(--text-secondary)] hover:text-white transition-colors"
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
        <div className="absolute top-full left-0 w-full lg:hidden glass border-t border-[var(--border-subtle)] px-6 py-4 flex flex-col items-end gap-3 z-50">
          {dynamicLinks.filter(l => !l.highlight && l.href !== '/login').map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="btn-outline text-xs py-2 px-4 w-fit justify-end text-right leading-tight"
            >
              <span>
                {link.label.split('\n').map((line, i) => (
                  <span key={i} className="block whitespace-nowrap">
                    {line}
                  </span>
                ))}
              </span>
            </a>
          ))}
          <a
            href="/mapa-productivo"
            onClick={() => setMenuOpen(false)}
            className="text-xs py-2 px-4 w-fit text-right rounded-full font-bold
              bg-gradient-to-r from-blue-600/30 to-cyan-600/20 border border-blue-500/40
              text-blue-300 hover:text-white transition-all flex items-center justify-end gap-1.5"
          >
            <span>{dict.navbar.mapa}</span>
            <span>🗺️</span>
          </a>
          {claseEnVivo ? (
            <Link
              href="/clases/demostracion"
              onClick={() => setMenuOpen(false)}
              className="text-xs py-2 px-4 w-fit text-right rounded-full font-bold
                bg-gradient-to-r from-red-600/30 to-rose-600/20 border border-red-500/40
                text-red-300 hover:text-white transition-all animate-pulse flex items-center justify-end gap-1.5"
            >
              <span>{dict.navbar.aulaEnVivo}</span>
              <span>🔴</span>
            </Link>
          ) : (
            <Link
              href="/clases/demostracion"
              onClick={() => setMenuOpen(false)}
              className="btn-outline text-xs py-2 px-4 w-fit justify-end text-right"
            >
              {dict.navbar.aula}
            </Link>
          )}
          {/* Acceso Miembros mobile — dispara OAuth directo */}
          <MembersAccessButton
            className="btn-outline text-xs py-2 px-4 w-fit justify-end text-right leading-tight bg-transparent cursor-pointer"
          >
            <span>{dynamicLinks[6].label}</span>
          </MembersAccessButton>
        </div>
      )}
    </nav>
  )
}
