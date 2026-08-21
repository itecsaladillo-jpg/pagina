'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SponsorModal, PublicSponsor, ModalItem } from './SponsorModal'

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
// pct: altura del contenedor relativa al nivel (platino 100%, oro 80%, plata 55%, bronce 35%, standard 10%)
const TIER_BASE: Record<string, { label: string; preferred: number; max: number; pct: number; glow: boolean }> = {
  platino: { label: 'Platinum', preferred: 3, max: 5, pct: 1.0, glow: true },
  oro: { label: 'Oro', preferred: 4, max: 6, pct: 0.8, glow: false },
  plata: { label: 'Plata', preferred: 5, max: 7, pct: 0.55, glow: false },
  bronce: { label: 'Bronce', preferred: 6, max: 8, pct: 0.35, glow: false },
  standard: { label: 'Standard', preferred: 8, max: 10, pct: 0.1, glow: false },
}

const BASE_H = 120

// Altura estándar por nivel de sponsoreo: platinum 100%, oro 80%, plata 55%, bronce 35%, standard 10%
function SponsorCard({ sponsor, cardH, glow, onOpen }: {
  sponsor: PublicSponsor
  cardH: number
  glow: boolean
  onOpen: () => void
}) {
  return (
    <button
      onClick={onOpen}
      style={{ height: cardH }}
      className={`bg-white rounded-2xl border border-[var(--border-subtle)] flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-105 hover:border-[var(--accent-warm)]/40 cursor-pointer ${glow ? 'ring-2 ring-amber-300/20 shadow-[0_0_40px_-10px_rgba(251,191,36,0.25)]' : ''}`}
    >
      {sponsor.logo_color_url ? (
        <img
          src={sponsor.logo_color_url}
          alt={sponsor.name}
          className="w-full h-full object-contain"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      ) : (
        <span className="text-black/70 text-sm font-semibold text-center px-2">
          {sponsor.name}
        </span>
      )}
    </button>
  )
}

export function NuestrosSociosSection() {
  const [sponsors, setSponsors] = useState<PublicSponsor[]>([])
  const [partners, setPartners] = useState<{ id: string; name: string; logo_url: string | null; category: string | null; actions_description: string | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<ModalItem | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      const supabase = createClient()
      const [{ data: sponsorsData }, { data: partnersData }] = await Promise.all([
        supabase.rpc('obtener_sponsors_publicos'),
        supabase.from('strategic_partners').select('id, name, logo_url, category, actions_description').eq('is_active', true).order('created_at', { ascending: false })
      ])
      if (mounted) {
        if (sponsorsData) setSponsors(sponsorsData as PublicSponsor[])
        if (partnersData) setPartners(partnersData)
        setLoading(false)
      }
    }

    fetchData()
    return () => { mounted = false }
  }, [])

  const grouped = TIER_ORDER
    .map((tier) => ({ tier, config: TIER_BASE[tier], list: sponsors.filter((s) => s.tier === tier) }))
    .filter((g) => g.list.length > 0)

  const upperTiers = grouped.filter((g) => g.tier === 'platino' || g.tier === 'oro')
  const lowerTiers = grouped.filter((g) => g.tier === 'plata' || g.tier === 'bronce' || g.tier === 'standard')

  const renderGroup = ({ tier, config, list }: (typeof grouped)[number]) => {
    const cols = Math.min(config.max, Math.max(2, Math.round(list.length * 0.9)))
    const cardH = Math.round(BASE_H * config.pct)

    return (
      <div key={tier} className="mb-8 last:mb-0">
        <div className={`grid ${COLS_CLASS[cols]} gap-3`}>
          {list.map((s) => (
            <SponsorCard
              key={s.id}
              sponsor={s}
              cardH={cardH}
              glow={config.glow}
              onOpen={() => setSelectedItem(s)}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <section id="socios" className="py-16 relative">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-10 lg:gap-14 items-start">
        <div className="text-left">
          <span className="inline-block text-xs font-bold tracking-[0.2em] text-[var(--accent-warm)] uppercase px-4 py-1.5 rounded-full border border-[var(--accent-warm)]/20 bg-[var(--accent-warm)]/5 mb-4">
            Institucional
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tighter">
            Nuestros <br />
            <span className="text-gradient">Socios</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-2xl leading-snug max-w-[280px]">
            Con ellos compartimos el sueño de un Saladillo de avanzada en un país mejor
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

            {partners.length > 0 && (
              <div className="lg:col-span-2">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/30">Alianzas Estratégicas</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {partners.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedItem({ ...p, _kind: 'partner' })}
                      className="bg-white/5 border border-white/5 rounded-xl flex items-center justify-center p-4 h-20 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer"
                      title={p.name}
                    >
                      {p.logo_url ? (
                        <img src={p.logo_url} alt={p.name} className="max-h-full max-w-full object-contain" loading="lazy" decoding="async" draggable={false} />
                      ) : (
                        <span className="text-white/50 text-xs text-center leading-tight">{p.name}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-[var(--text-secondary)] py-12 glass rounded-2xl border border-[var(--border-subtle)]">
            Conocé a las empresas que hacen posible el ITEC Augusto Cicaré.
          </div>
        )}
      </div>

      <SponsorModal sponsor={selectedItem} onClose={() => setSelectedItem(null)} />
    </section>
  )
}