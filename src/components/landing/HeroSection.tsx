import Link from 'next/link'
import Image from 'next/image'

export function HeroSection() {
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
          {[2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((num, i) => (
            <div 
              key={num} 
              className="absolute inset-0 animate-fade-cycle"
              style={{ animationDelay: `-${i * 15}s` }}
            >
              <Image
                src={`/cicare/cicare-${num}.jpg`}
                alt={`Augusto Cicaré ${num}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover grayscale brightness-50 contrast-125"
                priority={i === 0}
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
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 border border-[var(--border-glow)] relative z-10">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                ONG · Saladillo, Buenos Aires
              </span>
            </div>

            {/* Botones de Secciones (Mismos que el Header) */}
            <div className="flex flex-wrap items-center justify-start gap-2 mt-6 animate-fade-up delay-300 relative z-10" style={{ animationFillMode: 'both' }}>
              <a href="#acciones" className="btn-outline text-[10px] uppercase tracking-wider py-1.5 px-4 border-dashed opacity-70 hover:opacity-100 transition-all">
                Acciones
              </a>
              <a href="#videoteca" className="btn-outline text-[10px] uppercase tracking-wider py-1.5 px-4 border-dashed opacity-70 hover:opacity-100 transition-all">
                Videoteca
              </a>
              <a href="#nosotros" className="btn-outline text-[10px] uppercase tracking-wider py-1.5 px-4 border-dashed opacity-70 hover:opacity-100 transition-all">
                Nosotros
              </a>
              <a href="#sponsors" className="btn-outline text-[10px] uppercase tracking-wider py-1.5 px-4 border-dashed opacity-70 hover:opacity-100 transition-all">
                Sponsors
              </a>
              <a href="#ideas" className="btn-outline text-[10px] uppercase tracking-wider py-1.5 px-4 border-dashed opacity-70 hover:opacity-100 transition-all">
                Buzón de Ideas
              </a>
              <Link href="/login" className="btn-outline text-[10px] uppercase tracking-wider py-1.5 px-4 border-dashed opacity-70 hover:opacity-100 transition-all">
                Acceso Miembros
              </Link>
            </div>
          </div>

          {/* DERECHA — Palabras iluminadas */}
          <div className="relative flex flex-col items-start animate-fade-up delay-200" style={{ animationFillMode: 'both' }}>
            
            <div className="relative py-8">
              {/* Palabras (Capa superior) */}
              <h1 className="relative z-10 flex flex-col items-start gap-2">
                <span className="spotlight-text spotlight-i">Innovación</span>
                <span className="spotlight-text spotlight-t">Tecnología</span>
                <span className="spotlight-text spotlight-e">Emprendedurismo</span>
                <span className="spotlight-text spotlight-c">Ciencia</span>
              </h1>
            </div>

            <p className="relative z-10 text-[var(--text-secondary)] text-sm md:text-base max-w-sm text-left mt-8 leading-relaxed">
              El espacio donde la innovación y el trabajo colectivo
              transforman ideas en soluciones reales para Saladillo.
            </p>
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
