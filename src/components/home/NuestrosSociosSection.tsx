'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { SponsorModal } from './SponsorModal'
import type { PublicPartner, SponsorTier } from '@/types/database'
import type { SocioAlianza, SocioCanalDifusion, SocioSponsor } from '@/lib/data/socios'

interface NuestrosSociosSectionProps {
  sponsors?: SocioSponsor[]
  alianzas?: SocioAlianza[]
  canalesDifusion?: SocioCanalDifusion[]
}

const TIER_LAYOUT: Record<
  SponsorTier,
  { grid: string; cardH: number; pad: string; sizes: string; featured: boolean }
> = {
  platino: {
    grid: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    cardH: 120,
    pad: 'p-5',
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    featured: true,
  },
  oro: {
    grid: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardH: 88,
    pad: 'p-3',
    sizes: '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw',
    featured: false,
  },
  plata: { grid: '', cardH: 0, pad: '', sizes: '', featured: false },
  bronce: { grid: '', cardH: 0, pad: '', sizes: '', featured: false },
  standard: { grid: '', cardH: 0, pad: '', sizes: '', featured: false },
}

const PREMIUM_TIERS: SponsorTier[] = ['platino', 'oro']

const TIER_FULLWIDTH: Record<
  Exclude<SponsorTier, 'platino' | 'oro'>,
  { grid: string; cardH: number; pad: string; sizes: string }
> = {
  plata: {
    grid: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-5',
    cardH: 60,
    pad: 'p-2',
    sizes: '(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw',
  },
  bronce: {
    grid: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 md:gap-5',
    cardH: 52,
    pad: 'p-2',
    sizes: '(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 16vw, 12vw',
  },
  standard: {
    grid: 'grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11 gap-3 md:gap-4',
    cardH: 46,
    pad: 'p-1.5',
    sizes: '(max-width: 640px) 33vw, (max-width: 768px) 20vw, (max-width: 1024px) 14vw, 10vw',
  },
}

const ALLIANCES_GRID =
  'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-5'
const ALLIANCES_CARD_H = 56
const ALLIANCES_PAD = 'p-2'
const ALLIANCES_SIZES =
  '(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw'

const MEDIA_GRID =
  'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 md:gap-5'
const MEDIA_CARD_H = 48
const MEDIA_PAD = 'p-2'
const MEDIA_SIZES =
  '(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 16vw, 12vw'

const FULL_BLEED =
  'w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] px-4 md:px-12'

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function LogoImage({ src, alt, sizes }: { src: string; alt: string; sizes: string }) {
  if (/\.svg($|\?)/i.test(src)) {
    return (
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-contain"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    )
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className="object-contain"
      draggable={false}
    />
  )
}

function PartnerCard({ partner, cardH, pad, sizes, featured, onOpen }: {
  partner: PublicPartner
  cardH: number
  pad: string
  sizes: string
  featured?: boolean
  onOpen: () => void
}) {
  const logo = partner.logo_color_url || partner.logo_url

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      style={{ height: cardH }}
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
      aria-label={partner.name}
      className={`relative flex items-center justify-center overflow-hidden rounded-2xl border bg-white cursor-pointer transition-colors duration-300 ${
        featured
          ? 'border-amber-300/50 ring-1 ring-amber-300/25 shadow-[0_0_45px_-10px_rgba(251,191,36,0.35)] hover:border-amber-300/70 hover:shadow-[0_0_60px_-8px_rgba(251,191,36,0.5)]'
          : 'border-[var(--border-subtle)] hover:border-[var(--accent-warm)]/40'
      }`}
    >
      {logo ? (
        <div className={`absolute inset-0 ${pad}`}>
          <LogoImage src={logo} alt={partner.name} sizes={sizes} />
        </div>
      ) : (
        <span className="px-3 text-center text-sm font-semibold leading-tight text-black/70">
          {partner.name}
        </span>
      )}
    </motion.button>
  )
}

function sponsorFromServer(s: SocioSponsor): PublicPartner {
  return {
    id: s.id,
    name: s.name,
    type: 'SPONSOR',
    tier: s.tier,
    logo_color_url: s.logo_color_url,
    logo_url: s.logo_color_url,
    resena: s.resena,
    website_url: s.website_url,
    email: s.email,
    category: null,
    actions_description: null,
    rubro: null,
    description: null,
    contacto_nombre: null,
    contacto_telefono: null,
    actividad: null,
    zona_influencia: null,
    telefono: null,
    nombre_contacto: null,
    apellido_contacto: null,
    dial_radio: null,
  }
}

function alianzaFromServer(a: SocioAlianza): PublicPartner {
  return {
    id: a.id,
    name: a.name,
    type: 'STRATEGIC_ALLIANCE',
    tier: null,
    logo_color_url: null,
    logo_url: a.logo_url,
    resena: null,
    website_url: null,
    email: null,
    category: a.category,
    actions_description: a.actions_description,
    rubro: null,
    description: null,
    contacto_nombre: null,
    contacto_telefono: null,
    actividad: null,
    zona_influencia: null,
    telefono: null,
    nombre_contacto: null,
    apellido_contacto: null,
    dial_radio: null,
  }
}

function canalFromServer(c: SocioCanalDifusion): PublicPartner {
  return {
    id: c.id,
    name: c.nombre_medio,
    type: 'DIFFUSION_CHANNEL',
    tier: null,
    logo_color_url: null,
    logo_url: null,
    resena: null,
    website_url: c.url_web,
    email: c.email,
    category: c.tipo_medio,
    actions_description: null,
    rubro: null,
    description: null,
    contacto_nombre: null,
    contacto_telefono: null,
    actividad: null,
    zona_influencia: null,
    telefono: null,
    nombre_contacto: null,
    apellido_contacto: null,
    dial_radio: null,
  }
}

export function NuestrosSociosSection({ sponsors, alianzas, canalesDifusion }: NuestrosSociosSectionProps) {
  const serverPartners = useMemo(
    () =>
      sponsors !== undefined || alianzas !== undefined || canalesDifusion !== undefined
        ? [
            ...(sponsors ?? []).map(sponsorFromServer),
            ...(alianzas ?? []).map(alianzaFromServer),
            ...(canalesDifusion ?? []).map(canalFromServer),
          ]
        : null,
    [sponsors, alianzas, canalesDifusion]
  )

  const [partners, setPartners] = useState<PublicPartner[]>(() => serverPartners ?? [])
  const [loading, setLoading] = useState(() => serverPartners === null)
  const [selected, setSelected] = useState<PublicPartner | null>(null)

  useEffect(() => {
    if (serverPartners !== null) return

    let mounted = true

    const load = async () => {
      const supabase = createClient()

      const { data: unified, error: rpcError } = await supabase.rpc('obtener_socios_publicos')
      if (rpcError) {
        console.error('[NuestrosSocios] RPC obtener_socios_publicos error:', rpcError.message)
      }
      if (!rpcError && unified && unified.length > 0) {
        if (mounted) {
          setPartners(unified as PublicPartner[])
          setLoading(false)
        }
        return
      }

      const [{ data: sponsorsData }, { data: alliancesData }] = await Promise.all([
        supabase.rpc('obtener_sponsors_publicos'),
        supabase
          .from('strategic_partners')
          .select('id, name, logo_url, category, actions_description')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
      ])

      if (mounted) {
        const legacy: PublicPartner[] = []
        for (const s of (sponsorsData ?? []) as Array<{
          id: string
          name: string
          tier: string
          logo_color_url: string | null
          resena: string | null
          website_url: string | null
          email: string | null
        }>) {
          legacy.push({
            id: s.id,
            name: s.name,
            type: 'SPONSOR',
            tier: s.tier as PublicPartner['tier'],
            logo_color_url: s.logo_color_url,
            logo_url: s.logo_color_url,
            resena: s.resena,
            website_url: s.website_url,
            email: s.email,
            category: null,
            actions_description: null,
            rubro: null,
            description: null,
            contacto_nombre: null,
            contacto_telefono: null,
            actividad: null,
            zona_influencia: null,
            telefono: null,
            nombre_contacto: null,
            apellido_contacto: null,
            dial_radio: null,
          })
        }
        for (const p of alliancesData ?? []) {
          legacy.push({
            id: p.id,
            name: p.name,
            type: 'STRATEGIC_ALLIANCE',
            tier: null,
            logo_color_url: null,
            logo_url: p.logo_url,
            resena: null,
            website_url: null,
            email: null,
            category: p.category,
            actions_description: p.actions_description,
            rubro: null,
            description: null,
            contacto_nombre: null,
            contacto_telefono: null,
            actividad: null,
            zona_influencia: null,
            telefono: null,
            nombre_contacto: null,
            apellido_contacto: null,
            dial_radio: null,
          })
        }
        setPartners(legacy)
        setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [serverPartners])

  const sponsorsList = useMemo(() => partners.filter((p) => p.type === 'SPONSOR'), [partners])
  const alliances = useMemo(() => partners.filter((p) => p.type === 'STRATEGIC_ALLIANCE'), [partners])
  const media = useMemo(() => partners.filter((p) => p.type === 'DIFFUSION_CHANNEL'), [partners])

  const sponsorByTier = useMemo(() => {
    const groups = new Map<SponsorTier, PublicPartner[]>()
    for (const p of sponsorsList) {
      const tier = p.tier as SponsorTier
      const arr = groups.get(tier)
      if (arr) arr.push(p)
      else groups.set(tier, [p])
    }
    return groups
  }, [sponsorsList])

  return (
    <section id="socios" className="py-16 relative">
      {loading ? (
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-[var(--accent-warm)] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      ) : partners.length === 0 ? (
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center text-[var(--text-secondary)] py-12 glass rounded-2xl border border-[var(--border-subtle)]">
            Conocé a las empresas que hacen posible el ITEC Augusto Cicaré.
          </div>
        </div>
      ) : (
        <>
          {/* ─── ZONA CONTENIDA: Título + Platino + Oro ─── */}
          <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-10 lg:gap-14 items-start">
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

            <div className="lg:col-start-2 space-y-6">
              {PREMIUM_TIERS.map((tier) => {
                const list = sponsorByTier.get(tier)
                if (!list || list.length === 0) return null
                const layout = TIER_LAYOUT[tier]
                return (
                  <Reveal key={tier}>
                    <div className={`grid ${layout.grid} gap-3`}>
                      {list.map((p) => (
                        <PartnerCard
                          key={p.id}
                          partner={p}
                          cardH={layout.cardH}
                          pad={layout.pad}
                          sizes={layout.sizes}
                          featured={layout.featured}
                          onOpen={() => setSelected(p)}
                        />
                      ))}
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </div>

          {/* ─── BLOQUES FULL-BLEED INDEPENDIENTES ─── */}

          {/* Plata */}
          {(() => {
            const list = sponsorByTier.get('plata')
            if (!list || list.length === 0) return null
            const cfg = TIER_FULLWIDTH.plata
            return (
              <div className={`${FULL_BLEED} my-12`}>
                <Reveal>
                  <div className={`grid ${cfg.grid}`}>
                    {list.map((p) => (
                      <PartnerCard
                        key={p.id}
                        partner={p}
                        cardH={cfg.cardH}
                        pad={cfg.pad}
                        sizes={cfg.sizes}
                        onOpen={() => setSelected(p)}
                      />
                    ))}
                  </div>
                </Reveal>
              </div>
            )
          })()}

          {/* Bronce */}
          {(() => {
            const list = sponsorByTier.get('bronce')
            if (!list || list.length === 0) return null
            const cfg = TIER_FULLWIDTH.bronce
            return (
              <div className={`${FULL_BLEED} my-12`}>
                <Reveal>
                  <div className={`grid ${cfg.grid}`}>
                    {list.map((p) => (
                      <PartnerCard
                        key={p.id}
                        partner={p}
                        cardH={cfg.cardH}
                        pad={cfg.pad}
                        sizes={cfg.sizes}
                        onOpen={() => setSelected(p)}
                      />
                    ))}
                  </div>
                </Reveal>
              </div>
            )
          })()}

          {/* Standard */}
          {(() => {
            const list = sponsorByTier.get('standard')
            if (!list || list.length === 0) return null
            const cfg = TIER_FULLWIDTH.standard
            return (
              <div className={`${FULL_BLEED} my-12`}>
                <Reveal>
                  <div className={`grid ${cfg.grid}`}>
                    {list.map((p) => (
                      <PartnerCard
                        key={p.id}
                        partner={p}
                        cardH={cfg.cardH}
                        pad={cfg.pad}
                        sizes={cfg.sizes}
                        onOpen={() => setSelected(p)}
                      />
                    ))}
                  </div>
                </Reveal>
              </div>
            )
          })()}

          {/* Alianzas Estratégicas */}
          {alliances.length > 0 && (
            <div className={`${FULL_BLEED} my-12`}>
              <Reveal>
                <div className={`grid ${ALLIANCES_GRID}`}>
                  {alliances.map((p) => (
                    <PartnerCard
                      key={p.id}
                      partner={p}
                      cardH={ALLIANCES_CARD_H}
                      pad={ALLIANCES_PAD}
                      sizes={ALLIANCES_SIZES}
                      onOpen={() => setSelected(p)}
                    />
                  ))}
                </div>
              </Reveal>
            </div>
          )}

          {/* Canales de Comunicación / Prensa */}
          {media.length > 0 && (
            <div className={`${FULL_BLEED} my-12`}>
              <Reveal>
                <div className={`grid ${MEDIA_GRID}`}>
                  {media.map((p) => (
                    <PartnerCard
                      key={p.id}
                      partner={p}
                      cardH={MEDIA_CARD_H}
                      pad={MEDIA_PAD}
                      sizes={MEDIA_SIZES}
                      onOpen={() => setSelected(p)}
                    />
                  ))}
                </div>
              </Reveal>
            </div>
          )}
        </>
      )}

      <SponsorModal isOpen={selected !== null} onClose={() => setSelected(null)} entity={selected} />
    </section>
  )
}
