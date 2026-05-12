import Link from 'next/link'

export function IdeasSection() {
  return (
    <section id="ideas" className="py-16 relative overflow-hidden">
      {/* Fondo con gradiente */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <span className="inline-block text-xs font-bold tracking-[0.2em] text-[var(--accent-primary-2)] uppercase mb-6 px-4 py-1.5 rounded-full border border-[var(--accent-primary-2)]/20 bg-[var(--accent-primary-2)]/5">
          Buzón de Ideas
        </span>

        {/* Headline */}
        <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
          Tu idea puede ser{' '}
          <span className="text-gradient">el próximo proyecto</span>{' '}
          del ITEC
        </h2>

        <p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
          Tenemos un espacio abierto para que cualquier persona —miembro o no— pueda proponer
          proyectos, talleres, mejoras o cualquier idea que quiera ver hecha realidad.
        </p>

        {/* Cards de beneficios */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[
            { emoji: '🎯', title: 'Anónimo o con nombre', desc: 'Elegís cómo enviar tu propuesta' },
            { emoji: '🗳️', title: 'Sistema de votos', desc: 'La comunidad prioriza las mejores ideas' },
            { emoji: '🚀', title: 'Seguimiento real', desc: 'Las ideas aprobadas se implementan' },
          ].map((item) => (
            <div key={item.title} className="glass rounded-2xl p-5 border border-[var(--border-subtle)]">
              <div className="text-2xl mb-2">{item.emoji}</div>
              <p className="text-white font-semibold text-sm mb-1">{item.title}</p>
              <p className="text-[var(--text-muted)] text-xs">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA principal */}
        <Link href="/login" className="btn-primary text-base px-10 py-4 animate-pulse-glow">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
          <span>Enviar mi idea</span>
        </Link>

        <p className="text-[var(--text-muted)] text-xs mt-4">
          Necesitás ingresar con tu cuenta para enviar ideas
        </p>
      </div>
    </section>
  )
}
