const valores = [
  {
    icon: '💡',
    letter: 'I',
    color: 'bg-yellow-400 text-gray-900',
    title: 'Innovación',
    desc: 'Generamos ideas disruptivas y proyectos originales que desafían el statu quo y proponen nuevas formas de hacer las cosas.',
  },
  {
    icon: '⚙️',
    letter: 'T',
    color: 'bg-blue-500 text-white',
    title: 'Tecnología',
    desc: 'Adoptamos y desarrollamos herramientas tecnológicas que amplifican las capacidades de las personas y la comunidad.',
  },
  {
    icon: '🚀',
    letter: 'E',
    color: 'bg-red-500 text-white',
    title: 'Emprendedurismo',
    desc: 'Fomentamos la mentalidad emprendedora: la valentía de crear, experimentar, fallar y volver a intentarlo.',
  },
  {
    icon: '🔬',
    letter: 'C',
    color: 'bg-green-700 text-white',
    title: 'Ciencia',
    desc: 'Basamos nuestro trabajo en evidencia y metodología científica, democratizando el acceso al conocimiento.',
  },
]

export function AboutSection() {
  return (
    <section id="nosotros" className="py-28 relative">
      {/* Orbe decorativo */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Texto */}
          <div>
            <span className="inline-block text-xs font-bold tracking-[0.2em] text-[var(--accent-warm)] uppercase mb-4 px-4 py-1.5 rounded-full border border-[var(--accent-warm)]/20 bg-[var(--accent-warm)]/5">
              Nuestra identidad
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Un espacio donde la{' '}
              <span className="text-gradient">ciencia cobra vida</span>
            </h2>
            <p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-6">
              El ITEC Augusto Cicaré nació con una misión clara: democratizar el acceso al
              conocimiento científico y tecnológico en Saladillo. Somos una ONG formada por
              personas apasionadas que creen en el poder transformador de la ciencia.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-8">
              Nuestro nombre rinde homenaje a{' '}
              <strong className="text-white">Augusto Cicaré</strong>, el inventor argentino
              de Saladillo reconocido mundialmente por sus innovaciones en helicópteros —
              un símbolo de que la creatividad y la perseverancia no tienen límites geográficos.
            </p>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-[var(--border-glow)] to-transparent" />
              <span className="text-[var(--text-muted)] text-sm">Fundado en Saladillo, Buenos Aires</span>
            </div>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {valores.map((v, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 card-hover border border-[var(--border-subtle)]"
              >
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="text-white font-semibold mb-2">{v.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
