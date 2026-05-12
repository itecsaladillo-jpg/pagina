const comisiones = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
    color: 'from-blue-500 to-cyan-500',
    glow: 'rgba(59,130,246,0.3)',
    title: 'Innovación & Tecnología',
    description: 'Exploramos nuevas tecnologías y desarrollamos proyectos de software, hardware y sistemas embebidos para la comunidad.',
    tags: ['IA', 'IoT', 'Software', 'Electrónica'],
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
    color: 'from-violet-500 to-purple-600',
    glow: 'rgba(139,92,246,0.3)',
    title: 'Educación & Capacitación',
    description: 'Diseñamos y dictamos talleres, cursos y programas formativos en ciencia y tecnología para todas las edades.',
    tags: ['Talleres', 'Cursos', 'STEAM', 'Robótica'],
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    color: 'from-emerald-500 to-teal-500',
    glow: 'rgba(16,185,129,0.3)',
    title: 'Vinculación Comunitaria',
    description: 'Conectamos el ITEC con instituciones, empresas y organizaciones para generar impacto real en Saladillo y la región.',
    tags: ['Alianzas', 'Comunidad', 'Impacto', 'Redes'],
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
    color: 'from-amber-500 to-orange-500',
    glow: 'rgba(245,158,11,0.3)',
    title: 'Comunicación & Difusión',
    description: 'Contamos la historia del ITEC al mundo: redes sociales, prensa, eventos y contenido que inspira vocaciones científicas.',
    tags: ['Redes', 'Prensa', 'Eventos', 'Contenido'],
  },
]

export function ComisionesSection() {
  return (
    <section id="comisiones" className="py-16 relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-bold tracking-[0.2em] text-[var(--accent-cyan-2)] uppercase mb-4 px-4 py-1.5 rounded-full border border-[var(--accent-cyan-2)]/20 bg-[var(--accent-cyan-2)]/5">
            Estructura organizativa
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Nuestras <span className="text-gradient">Comisiones</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
            Cuatro ejes de trabajo colaborativo que articulan toda la actividad del ITEC
          </p>
        </div>

        {/* Grid de comisiones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {comisiones.map((com, i) => (
            <div
              key={i}
              className="glass rounded-2xl p-7 card-hover group cursor-default border border-[var(--border-subtle)]"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-start gap-5">
                {/* Ícono */}
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${com.color} flex items-center justify-center flex-shrink-0 text-white shadow-lg transition-shadow group-hover:shadow-xl`}
                  style={{ '--glow': com.glow } as React.CSSProperties}
                >
                  {com.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white mb-2">{com.title}</h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                    {com.description}
                  </p>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {com.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-[var(--text-secondary)] border border-white/10"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
