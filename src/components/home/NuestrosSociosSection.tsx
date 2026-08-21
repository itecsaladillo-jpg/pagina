'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SponsorModal } from './SponsorModal'
import type { PublicPartner, SponsorTier } from '@/types/database'

const TIER_ORDER: SponsorTier[] = ['platino', 'oro', 'plata', 'bronce', 'standard']

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

const TIER_BASE: Record<string, { label: string; preferred: number; max: number; pct: number; glow: boolean }> = {
  platino: { label: 'Platinum', preferred: 3, max: 5, pct: 1.0, glow: true },
  oro: { label: 'Oro', preferred: 4, max: 6, pct: 0.8, glow: false },
  plata: { label: 'Plata', preferred: 5, max: 7, pct: 0.55, glow: false },
  bronce: { label: 'Bronce', preferred: 6, max: 8, pct: 0.35, glow: false },
  standard: { label: 'Standard', preferred: 8, max: 10, pct: 0.1, glow: false },
}

const BASE_H = 120

const ALLIANCE_CATEGORY_LABELS: Record<string, string> = {
  institucion_educativa: 'Institución Educativa',
  organismo_publico: 'Organismo Público',
  ong: 'ONG / Asociación',
  empresa_aliada: 'Empresa Aliada',
  otro: 'Otro',
}

const MEDIA_CATEGORY_LABELS: Record<string, string> = {
  Radio: 'Radio',
  'Diario Papel': 'Diario',
  'Portal Web': 'Portal Web',
  TV: 'TV',
}

function SponsorCard({ partner, cardH, glow, onOpen }: {
  partner: PublicPartner
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
      {partner.logo_color_url || partner.logo_url ? (
        <img
          src={partner.logo_color_url || partner.logo_url || ''}
          alt={partner.name}
          className="w-full h-full object-contain"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      ) : (
        <span className="text-black/70 text-sm font-semibold text-center px-2">
          {partner.name}
        </span>
      )}
    </button>
  )
}

function PartnerCard({ partner, onOpen, height }: {
  partner: PublicPartner
  onOpen: () => void
  height?: string
}) {
  const categoryLabel = partner.category
    ? (ALLIANCE_CATEGORY_LABELS[partner.category] || partner.category)
    : null

  return (
    <button
      onClick={onOpen}
      className={`${height || 'h-24'} bg-white rounded-2xl border border-[var(--border-subtle)] flex flex-col items-center justify-center overflow-hidden transition-all duration-300 hover:scale-105 hover:border-[var(--accent-warm)]/40 cursor-pointer group`}
    >
      {partner.logo_url ? (
        <img
          src={partner.logo_url}
          alt={partner.name}
          className="w-full h-full object-contain p-2"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-1 px-2">
          <span className="text-black/70 text-xs font-semibold text-center leading-tight">
            {partner.name}
          </span>
          {categoryLabel && (
            <span className="text-black/40 text-[9px] uppercase tracking-wider">
              {categoryLabel}
            </span>
          )}
        </div>
      )}
    </button>
  )
}

function MediaCard({ partner, onOpen }: {
  partner: PublicPartner
  onOpen: () => void
}) {
  const typeLabel = partner.category
    ? (MEDIA_CATEGORY_LABELS[partner.category] || partner.category)
    : null

  return (
    <button
      onClick={onOpen}
      className="h-20 bg-white rounded-xl border border-[var(--border-subtle)] flex flex-col items-center justify-center overflow-hidden transition-all duration-300 hover:scale-105 hover:border-[var(--accent-warm)]/40 cursor-pointer px-3"
    >
      <span className="text-black/70 text-xs font-semibold text-center leading-tight truncate w-full">
        {partner.name}
      </span>
      {typeLabel && (
        <span className="text-black/40 text-[9px] uppercase tracking-wider mt-0.5">
          {typeLabel}
        </span>
      )}
    </button>
  )
}

function SectionDivider({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="relative py-6">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-white/10" />
      </div>
      <div className="relative flex justify-center">
        <div className="bg-[#020617] px-6 text-center">
          <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">{title}</h3>
          <p className="text-[var(--text-muted)] text-xs mt-1">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

export function NuestrosSociosSection() {
  const [partners, setPartners] = useState<PublicPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPartner, setSelectedPartner] = useState<PublicPartner | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchPartners = async () => {
      const supabase = createClient()
      const { data } = await supabase.rpc('obtener_socios_publicos')
      if (mounted && data) setPartners(data as PublicPartner[])
      if (mounted) setLoading(false)
    }

    fetchPartners()
    return () => { mounted = false }
  }, [])

  const sponsors = partners.filter(p => p.type === 'SPONSOR')
  const alliances = partners.filter(p => p.type === 'STRATEGIC_ALLIANCE')
  const media = partners.filter(p => p.type === 'DIFFUSION_CHANNEL')

  const sponsorGroups = TIER_ORDER
    .map((tier) => ({
      tier,
      config: TIER_BASE[tier],
      list: sponsors.filter((s) => s.tier === tier),
    }))
    .filter((g) => g.list.length > 0)

  const upperTiers = sponsorGroups.filter((g) => g.tier === 'platino' || g.tier === 'oro')
  const lowerTiers = sponsorGroups.filter((g) => g.tier === 'plata' || g.tier === 'bronce' || g.tier === 'standard')

  const renderSponsorGroup = ({ tier, config, list }: (typeof sponsorGroups)[number]) => {
    const cols = Math.min(config.max, Math.max(2, Math.round(list.length * 0.9)))
    const cardH = Math.round(BASE_H * config.pct)

    return (
      <div key={tier} className="mb-6 last:mb-0">
        <div className={`grid ${COLS_CLASS[cols]} gap-3`}>
          {list.map((p) => (
            <SponsorCard
              key={p.id}
              partner={p}
              cardH={cardH}
              glow={config.glow}
              onOpen={() => setSelectedPartner(p)}
            />
          ))}
        </div>
      </div>
    )
  }

  const renderAllianceGrid = () => {
    if (alliances.length === 0) return null
    const cols = Math.min(6, Math.max(2, Math.ceil(alliances.length / 2)))
    return (
      <div className={`grid ${COLS_CLASS[cols]} gap-3`}>
        {alliances.map((p) => (
          <PartnerCard
            key={p.id}
            partner={p}
            onOpen={() => setSelectedPartner(p)}
          />
        ))}
      </div>
    )
  }

  const renderMediaGrid = () => {
    if (media.length === 0) return null
    const cols = Math.min(8, Math.max(3, Math.ceil(media.length / 2)))
    return (
      <div className={`grid ${COLS_CLASS[cols]} gap-2`}>
        {media.map((p) => (
          <MediaCard
            key={p.id}
            partner={p}
            onOpen={() => setSelectedPartner(p)}
          />
        ))}
      </div>
    )
  }

  const hasAnyData = sponsors.length > 0 || alliances.length > 0 || media.length > 0

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
        ) : hasAnyData ? (
          <div className="space-y-2">
            {/* SPONSORS */}
            {sponsors.length > 0 && (
              <div>
                <div className="space-y-6">
                  {upperTiers.map(renderSponsorGroup)}
                </div>
                {lowerTiers.length > 0 && (
                  <div className="mt-6 space-y-6">
                    {lowerTiers.map(renderSponsorGroup)}
                  </div>
                )}
              </div>
            )}

            {/* ALIANZAS ESTRATÉGICAS */}
            {alliances.length > 0 && (
              <>
                <SectionDivider
                  title="Alianzas Estratégicas"
                  subtitle="Instituciones y organismos con los que ITEC articula"
                />
                {renderAllianceGrid()}
              </>
            )}

            {/* CANALES DE DIFUSIÓN */}
            {media.length > 0 && (
              <>
                <SectionDivider
                  title="Canales de Difusión"
                  subtitle="Medios de comunicación que difunden nuestras actividades"
                />
                {renderMediaGrid()}
              </>
            )}
          </div>
        ) : (
          <div className="text-center text-[var(--text-secondary)] py-12 glass rounded-2xl border border-[var(--border-subtle)]">
            Conocé a las entidades que hacen posible el ITEC Augusto Cicaré.
          </div>
        )}
      </div>

      <SponsorModal sponsor={selectedPartner} onClose={() => setSelectedPartner(null)} />
    </section>
  )
}
