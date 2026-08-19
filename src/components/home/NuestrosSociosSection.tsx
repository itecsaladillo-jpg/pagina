'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SponsorModal, PublicSponsor } from './SponsorModal'

const TIER_ORDER = ['platino', 'oro', 'plata', 'bronce', 'standard']

const TIER_CONFIG: Record<string, { label: string; grid: string; card: string; logo: string }> = {
  platino: {
    label: 'Platinum',
    grid: 'grid-cols-2 lg:grid-cols-3',
    card: 'p-6 min-h-[120px] ring-2 ring-amber-300/20 shadow-[0_0_40px_-10px_rgba(251,191,36,0.25)]',
    logo: 'max-h-14 sm:max-h-16',
  },
  oro: {
    label: 'Oro',
    grid: 'grid-cols-2 lg:grid-cols-4',
    card: 'p-5 min-h-[100px]',
    logo: 'max-h-12 sm:max-h-14',
  },
  plata: {
    label: 'Plata',
    grid: 'grid-cols-3 lg:grid-cols-5',
    card: 'p-4 min-h-[90px]',
    logo: 'max-h-11',
  },
  bronce: {
    label: 'Bronce',
    grid: 'grid-cols-3 lg:grid-cols-6',
    card: 'p-4 min-h-[80px]',
    logo: 'max-h-10',
  },
  standard: {
    label: 'Standard',
    grid: 'grid-cols-4 lg:grid-cols-8',
    card: 'p-3 min-h-[70px]',
    logo: 'max-h-9',
  },
}

export function NuestrosSociosSection() {
  const [sponsors, setSponsors] = useState<PublicSponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSponsor, setSelectedSponsor] = useState<PublicSponsor | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchSponsors = async () => {
      const supabase = createClient()
      const { data } = await supabase.rpc('obtener_sponsors_publicos')
      if (mounted && data) setSponsors(data as PublicSponsor[])
      if (mounted) setLoading(false)
    }

    fetchSponsors()
    return () => {
      mounted = false
    }
  }, [])

  const grouped = TIER_ORDER
    .map((tier) => ({ tier, config: TIER_CONFIG[tier], list: sponsors.filter((s) => s.tier === tier) }))
    .filter((g) => g.list.length > 0)

  return (
    <section id="socios" className="py-16 relative">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-10 lg:gap-14 items-start">
        <div className="lg:sticky lg:top-8 text-left">
          <span className="inline-block text-xs font-bold tracking-[0.2em] text-[var(--accent-warm)] uppercase mb-4 px-4 py-1.5 rounded-full border border-[var(--accent-warm)]/20 bg-[var(--accent-warm)]/5">
            Institucional
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            NUESTROS <span className="text-gradient">SOCIOS</span>
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Con estas empresas compartimos el sueño de un Saladillo de avanzada en un país mejor
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-[var(--accent-warm)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : grouped.length > 0 ? (
          <div>
            {grouped.map(({ tier, config, list }) => (
              <div key={tier} className="mb-8 last:mb-0">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--text-muted)]">
                    {config.label}
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-[var(--border-glow)] to-transparent" />
                </div>

                <div className={`grid ${config.grid} gap-3`}>
                  {list.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSponsor(s)}
                      className={`glass rounded-2xl border border-[var(--border-subtle)] flex items-center justify-center transition-all duration-300 hover:scale-105 hover:border-[var(--accent-warm)]/40 cursor-pointer ${config.card}`}
                    >
                      {s.logo_color_url ? (
                        <img
                          src={s.logo_color_url}
                          alt={s.name}
                          className={`${config.logo} max-w-full w-auto object-contain`}
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                        />
                      ) : (
                        <span className="text-white/70 text-sm font-semibold text-center px-2">
                          {s.name}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-[var(--text-secondary)] py-12 glass rounded-2xl border border-[var(--border-subtle)]">
            Conocé a las empresas que hacen posible el ITEC Augusto Cicaré.
          </div>
        )}
      </div>

      <SponsorModal sponsor={selectedSponsor} onClose={() => setSelectedSponsor(null)} />
    </section>
  )
}