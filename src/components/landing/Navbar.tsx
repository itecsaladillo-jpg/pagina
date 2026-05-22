'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [claseEnVivo, setClaseEnVivo] = useState(false)
  const pathname = usePathname()

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
        <div className="flex items-center gap-12">
          {/* Logo */}
          <Link href="/" className="group relative">
            {/* Iluminación puntual debajo del logo */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-24 h-10 bg-[#3b82f6] blur-[40px] opacity-50 -z-10 rounded-full" />
            
            <Image
              src="/logoitectrans_v2.png"
              alt="ITEC Saladillo"
              width={248}
              height={95}
              className={`w-auto object-contain group-hover:opacity-90 transition-all duration-300 relative z-10 ${
                showSolidNavbar ? 'h-14' : 'h-18'
              }`}
              priority
            />
          </Link>

          {/* Desktop nav — Izquierda (Primeros 5 + Mapa Productivo) */}
          <div className="hidden md:flex items-center gap-2 ml-[80px]">
            {navLinks.slice(0, 5).map((link) => {
              const isIdeas = link.label === 'Buzón de Ideas'
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`btn-outline text-[10px] uppercase tracking-wider py-1 px-3 border-dashed opacity-70 hover:opacity-100 transition-all flex items-center justify-center text-center leading-tight min-h-[44px] whitespace-normal gap-0 ${
                    isIdeas ? 'w-[120px]' : 'w-[105px]'
                  }`}
                >
                  {isIdeas ? (
                    <span className="block leading-tight">
                      Buzón<br /><span className="whitespace-nowrap">de Ideas</span>
                    </span>
                  ) : (
                    <span>{link.label}</span>
                  )}
                </a>
              )
            })}
            {/* Mapa Productivo — destacado */}
            <a
              href="/mapa-productivo"
              className="text-[10px] uppercase tracking-wider py-1 px-4 rounded-full font-bold
                bg-gradient-to-r from-blue-600/30 to-cyan-600/20 border border-blue-500/40
                text-blue-300 hover:text-white hover:border-blue-400 hover:from-blue-600/50 hover:to-cyan-600/30
                transition-all duration-200 flex items-center justify-center gap-1.5 min-h-[44px] text-center w-[130px] whitespace-normal leading-tight"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
              <span className="leading-tight">Mapa Productivo</span>
            </a>
          </div>
        </div>

        {/* Desktop nav — Derecha (Acceso Miembros y Aula Virtual) */}
        <div className="hidden md:flex items-center gap-3">
          {claseEnVivo ? (
            <Link
              href="/clases/demostracion"
              className="text-[10px] uppercase tracking-wider py-1 px-4 rounded-full font-bold
                bg-gradient-to-r from-red-600/30 to-rose-600/20 border border-red-500/40
                text-red-300 hover:text-white hover:border-red-400 hover:from-red-600/50 hover:to-rose-600/30
                transition-all duration-200 flex items-center justify-center gap-1.5 min-h-[44px] text-center w-[130px] whitespace-normal leading-tight animate-pulse"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
              <span className="leading-tight">Aula Virtual</span>
            </Link>
          ) : (
            <Link
              href="/clases/demostracion"
              className="btn-outline text-[10px] uppercase tracking-wider py-1 px-4 border-dashed opacity-70 hover:opacity-100 transition-all flex items-center justify-center text-center min-h-[44px] w-[130px] whitespace-normal leading-tight"
            >
              <span className="leading-tight">Aula Virtual</span>
            </Link>
          )}
          <a
            href={navLinks[6].href}
            className="btn-outline text-[10px] uppercase tracking-wider py-1 px-4 border-dashed opacity-70 hover:opacity-100 transition-all flex items-center justify-center text-center min-h-[44px] w-[130px] whitespace-normal leading-tight"
          >
            <span className="leading-tight">{navLinks[6].label}</span>
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
          {navLinks.filter(l => !l.highlight).map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="btn-outline text-xs py-2 px-4 w-full justify-center"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/mapa-productivo"
            onClick={() => setMenuOpen(false)}
            className="text-xs py-2 px-4 w-full text-center rounded-full font-bold
              bg-gradient-to-r from-blue-600/30 to-cyan-600/20 border border-blue-500/40
              text-blue-300 hover:text-white transition-all"
          >
            🗺️ Mapa Productivo
          </a>
          {claseEnVivo ? (
            <Link
              href="/clases/demostracion"
              onClick={() => setMenuOpen(false)}
              className="text-xs py-2 px-4 w-full text-center rounded-full font-bold
                bg-gradient-to-r from-red-600/30 to-rose-600/20 border border-red-500/40
                text-red-300 hover:text-white transition-all"
            >
              🔴 Aula Virtual (En Vivo)
            </Link>
          ) : (
            <Link
              href="/clases/demostracion"
              onClick={() => setMenuOpen(false)}
              className="btn-outline text-xs py-2 px-4 w-full justify-center"
            >
              Aula Virtual
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
