import Link from 'next/link'

const capacitaciones = [
  {
    badge: 'Próximamente',
    badgeColor: 'text-amber-400 border-amber-400/20 bg-amber-400/5',
    title: 'Introducción a la Programación',
    desc: 'Aprendé los fundamentos de la programación con Python desde cero, sin requisitos previos.',
    duration: '8 semanas',
    modalidad: 'Presencial',
    tags: ['Python', 'Principiantes', 'Gratuito'],
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    badge: 'En planificación',
    badgeColor: 'text-violet-400 border-violet-400/20 bg-violet-400/5',
    title: 'Electrónica & Arduino',
    desc: 'Diseñá y construí tus propios circuitos electrónicos con Arduino y componentes básicos.',
    duration: '6 semanas',
    modalidad: 'Presencial',
    tags: ['Arduino', 'IoT', 'Circuitos'],
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    badge: 'En planificación',
    badgeColor: 'text-violet-400 border-violet-400/20 bg-violet-400/5',
    title: 'Robótica para Jóvenes',
    desc: 'Construí y programá robots mientras aprendés física, matemática y lógica de forma divertida.',
    duration: '10 semanas',
    modalidad: 'Presencial',
    tags: ['Robótica', 'STEAM', 'Jóvenes'],
    gradient: 'from-emerald-500 to-teal-500',
  },
]

export function CapacitacionesSection() {
  return (
    <section id="capacitaciones" className="py-28 relative">
      <div className="absolute left-0 top-1/3 w-80 h-80 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold tracking-[0.2em] text-[var(--accent-warm)] uppercase mb-4 px-4 py-1.5 rounded-full border border-[var(--accent-warm)]/20 bg-[var(--accent-warm)]/5">
            Formación continua
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="text-gradient">Capacitaciones</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
            Programas formativos diseñados para llevar el conocimiento científico a toda la comunidad
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {capacitaciones.map((cap, i) => (
            <div
              key={i}
              className="glass rounded-2xl overflow-hidden card-hover border border-[var(--border-subtle)] flex flex-col"
            >
              {/* Barra superior de color */}
              <div className={`h-1.5 bg-gradient-to-r ${cap.gradient}`} />

              <div className="p-7 flex flex-col flex-1">
                {/* Badge */}
                <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border mb-4 w-fit ${cap.badgeColor}`}>
                  {cap.badge}
                </span>

                <h3 className="text-lg font-bold text-white mb-3">{cap.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4 flex-1">
                  {cap.desc}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mb-4">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {cap.duration}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {cap.modalidad}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {cap.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-[var(--text-secondary)] border border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-[var(--text-muted)] text-sm mb-4">
            ¿Querés proponer una capacitación o ser instructor?
          </p>
          <a href="#ideas" className="btn-outline text-sm px-6 py-2.5">
            Enviá tu idea
          </a>
        </div>
      </div>
    </section>
  )
}
