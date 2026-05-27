'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export function AboutSection() {
  const { dict } = useLanguage()

  const valores = [
    {
      icon: '💡',
      letter: 'I',
      color: 'bg-yellow-400 text-gray-900',
      title: dict.about.pilares.innovacion.title,
      desc: dict.about.pilares.innovacion.desc,
    },
    {
      icon: '⚙️',
      letter: 'T',
      color: 'bg-blue-500 text-white',
      title: dict.about.pilares.tecnologia.title,
      desc: dict.about.pilares.tecnologia.desc,
    },
    {
      icon: '🚀',
      letter: 'E',
      color: 'bg-red-500 text-white',
      title: dict.about.pilares.emprendedurismo.title,
      desc: dict.about.pilares.emprendedurismo.desc,
    },
    {
      icon: '🔬',
      letter: 'C',
      color: 'bg-green-700 text-white',
      title: dict.about.pilares.ciencia.title,
      desc: dict.about.pilares.ciencia.desc,
    },
  ]

  return (
    <section id="nosotros" className="py-16 relative">
      {/* Orbe decorativo */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Texto */}
          <div>
            <span className="inline-block text-xs font-bold tracking-[0.2em] text-[var(--accent-warm)] uppercase mb-4 px-4 py-1.5 rounded-full border border-[var(--accent-warm)]/20 bg-[var(--accent-warm)]/5">
              {dict.about.badge}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {dict.about.headingStart}{' '}
              <span className="text-gradient">{dict.about.headingGradient}</span>
            </h2>
            <p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-6">
              {dict.about.desc1}
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-8">
              {dict.about.desc2}
            </p>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-[var(--border-glow)] to-transparent" />
              <span className="text-[var(--text-muted)] text-sm">{dict.about.fundacion}</span>
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
