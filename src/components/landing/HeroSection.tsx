'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/contexts/LanguageContext'
import { MembersAccessButton } from '@/components/auth/MembersAccessButton'
import { StreamingPlayer } from '@/components/landing/StreamingPlayer'

export function HeroSection() {
  const { dict } = useLanguage()
  const FRASES_HERO = [
    "Construimos futuro desde la raíz: potenciando saberes, impulsando pymes y abriendo horizontes en Saladillo. Si logramos encender la chispa de los grandes inventores de mañana, todo este viaje habrá valido la pena.",
    "Aportamos valor al trabajo diario y al motor pyme de Saladillo. Cada joven capacitado es una promesa viva; si descubrimos a tiempo al próximo gran creador local, habremos cumplido nuestra misión y allí estaremos para acompañar su camino.",
    "Impulsar el desarrollo productivo y guiar a las nuevas generaciones es nuestra razón de ser en Saladillo. Si en ese camino descubrimos al genio que marcará el mañana, todo el esfuerzo cobra aún más sentido."
  ]
  const [claseEnVivo, setClaseEnVivo] = useState(false)
  const [fraseIndex, setFraseIndex] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const [streamingActive, setStreamingActive] = useState(false)
  const [streamingUrl, setStreamingUrl] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
    setFraseIndex(Math.floor(Math.random() * FRASES_HERO.length))
  }, [])
  
  const displayPhrase = isMounted ? FRASES_HERO[fraseIndex] : FRASES_HERO[0]

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
      .channel('clases_en_vivo_hero')
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

  // Fetch streaming status
  useEffect(() => {
    const fetchStreamingStatus = async () => {
      try {
        const response = await fetch('/api/streaming/status')
        const data = await response.json()
        setStreamingActive(data.isActive)
        setStreamingUrl(data.youtubeUrl)
      } catch (err) {
        console.error('Error fetching streaming status:', err)
      }
    }

    fetchStreamingStatus()
  }, [])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-black grid-bg">
      
      {/* Slider de fotos de Augusto Cicaré (Capa inferior con efecto Fade) */}
      <div className="absolute top-0 right-0 w-full md:w-1/2 h-full z-0 overflow-hidden pointer-events-none opacity-40">
        {/* Filtro Azul solicitado */}
        <div className="absolute inset-0 z-20 bg-blue-600/40 mix-blend-color" />
        <div className="absolute inset-0 z-20 bg-gradient-to-br from-black/20 via-transparent to-black/80" />
        <div className="absolute inset-0 z-20 bg-gradient-to-r from-black via-transparent to-transparent" />
        
        {/* Contenedor de imágenes apiladas (imágenes disponibles) */}
        <div className="relative w-full h-full flex items-center justify-center">
          {[2, 5, 7, 10, 13, 15].map((num, i) => (
            <div 
              key={num} 
              className="absolute inset-0 animate-fade-cycle"
              style={{ animationDelay: `-${i * 35}s` }}
            >
              <Image
                src={`/cicare/cicare-${num}.jpg`}
                alt={`Augusto Cicaré ${num}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover grayscale brightness-50 contrast-125"
                priority={i === 0}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>

      </div>

      {/* Línea de escáner decorativa */}
      <div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent pointer-events-none"
        style={{ top: '45%' }}
      />

      {/* Layout dos columnas */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-8 md:px-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-8">

          {/* IZQUIERDA — Logo */}
          <div className="flex flex-col items-start gap-6 animate-fade-up -translate-y-[30px] relative">
            
            {/* Gradiente de fondo específico para el logo (Glow) */}
            <div 
              className="absolute -left-20 top-0 bg-[#3b82f6] blur-[100px] opacity-40 -z-10 scale-[1.8] w-[400px] h-[300px]"
              style={{ borderRadius: '50%' }}
            />

            <Image
              src="/logoitectrans_v2.png"
              alt="ITEC Saladillo"
              width={400}
              height={150}
              className="w-64 sm:w-80 md:w-96 h-auto object-contain drop-shadow-2xl relative z-10"
              priority
            />

            {/* Badge */}
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 border border-[var(--border-glow)] relative z-10 max-w-full">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
              <span className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-medium text-[var(--text-secondary)] text-center leading-tight">
                {dict.hero.badge}
              </span>
            </div>

            {/* Botones de Secciones — Diseño jerárquico */}
            <div className="flex flex-col gap-3 mt-6 animate-fade-up delay-300 relative z-10" style={{ animationFillMode: 'both' }}>

              {/* Fila principal: Aula Virtual + Mapa Productivo (destacados) */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/clases/demostracion"
                  className={`group relative text-xs uppercase tracking-wider font-bold py-2.5 px-6 rounded-full
                    transition-all duration-300 flex items-center gap-2 overflow-hidden
                    ${claseEnVivo
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 border-2 border-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse'
                      : 'bg-gradient-to-r from-blue-600/20 to-cyan-600/10 border border-blue-500/30 text-blue-300 hover:text-white hover:border-blue-400 hover:from-blue-600/40 hover:to-cyan-600/20 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                    }`}
                >
                  {claseEnVivo && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  {claseEnVivo ? dict.navbar.aulaEnVivo : dict.navbar.aula}
                </Link>

                <Link
                  href="/mapa-productivo"
                  className="group relative text-xs uppercase tracking-wider font-bold py-2.5 px-6 rounded-full
                    bg-gradient-to-r from-blue-600/20 to-cyan-600/10 border border-blue-500/30
                    text-blue-300 hover:text-white hover:border-cyan-400
                    hover:from-blue-600/40 hover:to-cyan-600/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]
                    transition-all duration-300 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                  </svg>
                  {dict.navbar.mapa}
                </Link>
              </div>

              {/* Fila secundaria: Videoteca, Sponsors, Nosotros, Buzón de Ideas */}
              <div className="flex flex-wrap items-center gap-2">
                <a href="#videoteca" className="btn-outline text-[10px] uppercase tracking-wider py-1.5 px-4 border-dashed opacity-70 hover:opacity-100 transition-all">
                  {dict.navbar.videoteca}
                </a>
                <a href="#equipo" className="btn-outline text-[10px] uppercase tracking-wider py-1.5 px-4 border-dashed opacity-70 hover:opacity-100 transition-all">
                  {dict.navbar.nosotros}
                </a>
                <a href="#socios" className="btn-outline text-[10px] uppercase tracking-wider py-1.5 px-4 border-dashed opacity-70 hover:opacity-100 transition-all">
                  {dict.navbar.sponsors}
                </a>
                <a href="#ideas" className="btn-outline text-[10px] uppercase tracking-wider py-1.5 px-4 border-dashed opacity-70 hover:opacity-100 transition-all">
                  {dict.navbar.ideas}
                </a>
              </div>

              {/* Separador visual + Acceso Miembros */}
              <div className="flex items-center gap-3 mt-1 pt-3 border-t border-white/5">
                <MembersAccessButton className="text-[10px] uppercase tracking-wider py-1.5 px-4 rounded-full font-semibold
                  bg-white/5 border border-white/10 text-[var(--text-secondary)]
                  hover:bg-white/10 hover:border-white/20 hover:text-white
                  transition-all duration-300 flex items-center gap-2 cursor-pointer">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  {dict.navbar.miembros}
                </MembersAccessButton>
              </div>

            </div>
          </div>

          {/* DERECHA — Streaming Player o Palabras iluminadas */}
          <div className="relative flex flex-col items-start animate-fade-up delay-200" style={{ animationFillMode: 'both' }}>
            
            {streamingActive && streamingUrl ? (
              <StreamingPlayer youtubeUrl={streamingUrl} />
            ) : (
              <>
                <div className="relative py-8">
                  {/* Palabras (Capa superior) */}
                  <h1 className="relative z-10 flex flex-col items-start gap-2">
                    <span className="spotlight-text spotlight-i">{dict.about.pilares.innovacion.title}</span>
                    <span className="spotlight-text spotlight-t">{dict.about.pilares.tecnologia.title}</span>
                    <span className="spotlight-text spotlight-emprendedurismo spotlight-e">{dict.about.pilares.emprendedurismo.title}</span>
                    <span className="spotlight-text spotlight-c">{dict.about.pilares.ciencia.title}</span>
                  </h1>
                </div>

                <p className="relative z-10 text-[var(--text-secondary)] text-sm md:text-base max-w-sm text-left mt-8 leading-relaxed">
                  {displayPhrase}
                </p>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Flecha de scroll */}
      <a
        href="#nosotros"
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[var(--text-muted)] hover:text-[var(--accent-cyan-2)] transition-colors animate-float"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 5.25l-7.5 7.5-7.5-7.5m15 6l-7.5 7.5-7.5-7.5" />
        </svg>
      </a>
    </section>
  )
}
