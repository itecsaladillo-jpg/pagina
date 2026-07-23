'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { PublicIdeasForm } from '@/components/ideas/PublicIdeasForm'

export function IdeasSection() {
  const { dict } = useLanguage()

  const beneficios = [
    { emoji: '🎯', title: dict.ideas.beneficios[0].title, desc: dict.ideas.beneficios[0].desc },
    { emoji: '🗳️', title: dict.ideas.beneficios[1].title, desc: dict.ideas.beneficios[1].desc },
    { emoji: '🚀', title: dict.ideas.beneficios[2].title, desc: dict.ideas.beneficios[2].desc },
  ]

  return (
    <section id="ideas" className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <span className="inline-block text-xs font-bold tracking-[0.2em] text-[var(--accent-primary-2)] uppercase mb-6 px-4 py-1.5 rounded-full border border-[var(--accent-primary-2)]/20 bg-[var(--accent-primary-2)]/5">
          {dict.ideas.badge}
        </span>

        <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
          {dict.ideas.headingStart}{' '}
          <span className="text-gradient">{dict.ideas.headingGradient}</span>{' '}
          {dict.ideas.headingEnd}
        </h2>

        <p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
          {dict.ideas.desc}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {beneficios.map((item) => (
            <div key={item.title} className="glass rounded-2xl p-5 border border-[var(--border-subtle)]">
              <div className="text-2xl mb-2">{item.emoji}</div>
              <p className="text-white font-semibold text-sm mb-1">{item.title}</p>
              <p className="text-[var(--text-muted)] text-xs">{item.desc}</p>
            </div>
          ))}
        </div>

        <PublicIdeasForm />
      </div>
    </section>
  )
}
