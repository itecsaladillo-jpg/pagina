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

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="text-left">
            <span className="inline-block text-xs font-bold tracking-[0.2em] text-[var(--accent-primary-2)] uppercase mb-6 px-4 py-1.5 rounded-full border border-[var(--accent-primary-2)]/20 bg-[var(--accent-primary-2)]/5">
              {dict.ideas.badge}
            </span>

            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              {dict.ideas.headingStart}
              <br />
              <span className="text-gradient block">{dict.ideas.headingGradient}</span>
              <br />
              {dict.ideas.headingEnd}
            </h2>

            <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-8 whitespace-pre-line">
              {dict.ideas.desc}
            </p>

            <div className="flex flex-wrap gap-3">
              {beneficios.slice(0, 2).map((item) => (
                <div key={item.title} className="glass rounded-2xl p-4 border border-[var(--border-subtle)] flex items-start gap-3 flex-1 min-w-[200px]">
                  <div className="text-2xl shrink-0 mt-0.5">{item.emoji}</div>
                  <div>
                    <p className="text-white font-semibold text-sm mb-0.5">{item.title}</p>
                    <p className="text-[var(--text-muted)] text-xs">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-left">
            <PublicIdeasForm />

            <div className="glass rounded-2xl p-4 border border-[var(--border-subtle)] flex items-start gap-3 mt-4">
              <div className="text-2xl shrink-0 mt-0.5">{beneficios[2].emoji}</div>
              <div>
                <p className="text-white font-semibold text-sm mb-0.5">{beneficios[2].title}</p>
                <p className="text-[var(--text-muted)] text-xs">{beneficios[2].desc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
