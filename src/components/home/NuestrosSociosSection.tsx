'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SponsorModal, PublicSponsor } from './SponsorModal'

const TIER_ORDER = ['platino', 'oro', 'plata', 'bronce', 'standard']

// Columnas dinámicas según cantidad de logos (2 a 10 columnas)
const COLS_CLASS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
}

// preferred: columnas de referencia del nivel; max: tope de columnas
// minH/logoH son los tamaños base con las columnas "preferred"
const TIER_BASE: Record<string, { label: string; preferred: number; max: number; minH: number; logoH: number; glow: boolean }> = {
  platino: { label: 'Platinum', preferred: 3, max: 5, minH: 110, logoH: 64, glow: true },
  oro: { label: 'Oro', preferred: 4, max: 6, minH: 95, logoH: 56, glow: false },
  plata: { label: 'Plata', preferred: 5, max: 7, minH: 85, logoH: 48, glow: false },
  bronce: { label: 'Bronce', preferred: 6, max: 8, minH: 75, logoH: 42, glow: false },
  standard: { label: 'Standard', preferred: 8, max: 10, minH: 65, logoH: 36, glow: false },
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
    .map((tier) => ({ tier, config: TIER_BASE[tier], list: sponsors.filter((s) => s.tier === tier) }))
    .filter((g) => g.list.length > 0)

  const upperTiers = grouped.filter((g) => g.tier === 'platino' || g.tier === 'oro')
  const lowerTiers = grouped.filter((g) => g.tier === 'plata' || g.tier === 'bronce' || g.tier === 'standard')

  const renderGroup = ({ tier, config, list }: (typeof grouped)[number]) => {
    const cols = Math.min(config.max, Math.max(2, Math.round(list.length * 0.9)))
    const scale = config.preferred / cols
    const cardMinH = Math.round(config.minH * scale)
    const logoH = Math.min(96, Math.round(config.logoH * scale))

    return (
      <div key={tier} className="mb-8 last:mb-0">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--text-muted)]">
            {config.label}
          </h3>
          <div className="h-px flex-1 bg-gradient-to-r from-[var(--border-glow)] to-transparent" />
        </div>

        <div className={`grid ${COLS_CLASS[cols]} gap-3`}>
          {list.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSponsor(s)}
              style={{ minHeight: cardMinH }}
              className={`glass rounded-2xl border border-[var(--border-subtle)] p-3 sm:p-4 flex items-center justify-center transition-all duration-300 hover:scale-105 hover:border-[var(--accent-warm)]/40 cursor-pointer ${config.glow ? 'ring-2 ring-amber-300/20 shadow-[0_0_40px_-10px_rgba(251,191,36,0.25)]' : ''}`}
            >
              {s.logo_color_url ? (
                <img
                  src={s.logo_color_url}
                  alt={s.name}
                  style={{ maxHeight: logoH }}
                  className="max-w-full w-auto object-contain"
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
    )
  }

  return (
    <section id="socios" className="py-16 relative">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-10 lg:gap-14 items-start">
        <div className="lg:sticky lg:top-8 text-left">
          <span className="inline-block text-xs font-bold tracking-[0.2em] text-[var(--accent-warm)] uppercase px-4 py-1.5 rounded-full border border-[var(--accent-warm)]/20 bg-[var(--accent-warm)]/5 mb-4">
            Institucional
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tighter">
            Nuestros <br />
            <span className="text-gradient">Socios</span>
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
          <>
            <div className="space-y-8">
              {upperTiers.map(renderGroup)}
            </div>

            {lowerTiers.length > 0 && (
              <div className="lg:col-span-2 space-y-8">
                {lowerTiers.map(renderGroup)}
              </div>
            )}
          </>
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