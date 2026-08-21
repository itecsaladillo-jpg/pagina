'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, ExternalLink } from 'lucide-react'

export interface PublicSponsor {
  id: string
  name: string
  tier: string
  logo_color_url: string | null
  resena: string | null
  website_url: string | null
  email: string | null
}

export interface PartnerItem {
  id: string
  name: string
  logo_url: string | null
  category: string | null
  resena: string | null
  website_url: string | null
  email: string | null
}

export type ModalItem = (PublicSponsor & { _kind?: 'sponsor' }) | (PartnerItem & { _kind: 'partner' })

const CATEGORY_LABELS: Record<string, string> = {
  institucion_educativa: 'Institución Educativa',
  organismo_publico: 'Organismo Público',
  ong: 'ONG / Asociación',
  empresa_aliada: 'Empresa Aliada',
  otro: 'Otro',
}

export const TIER_META: Record<string, { label: string; className: string }> = {
  platino: { label: 'Platinum', className: 'bg-slate-300/10 text-slate-200 border-slate-300/30' },
  oro: { label: 'Oro', className: 'bg-amber-400/10 text-amber-300 border-amber-400/30' },
  plata: { label: 'Plata', className: 'bg-gray-400/10 text-gray-300 border-gray-400/30' },
  bronce: { label: 'Bronce', className: 'bg-orange-500/10 text-orange-300 border-orange-500/30' },
  standard: { label: 'Standard', className: 'bg-blue-400/10 text-blue-300 border-blue-400/30' },
}

interface Props {
  sponsor: ModalItem | null
  onClose: () => void
}

export function SponsorModal({ sponsor, onClose }: Props) {
  useEffect(() => {
    if (!sponsor) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [sponsor, onClose])

  const tierMeta = sponsor && 'tier' in sponsor ? TIER_META[sponsor.tier] || TIER_META.standard : null
  const categoryLabel = sponsor && 'category' in sponsor && sponsor.category
    ? (CATEGORY_LABELS[sponsor.category] || sponsor.category)
    : null

  const logoUrl = sponsor
    ? (('logo_color_url' in sponsor ? sponsor.logo_color_url : null) || ('logo_url' in sponsor ? (sponsor as PartnerItem).logo_url : null))
    : null

  return (
    <AnimatePresence>
      {sponsor && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0a0f1e] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
          >
            {/* Header con logo */}
            <div className="relative h-36 bg-gradient-to-r from-[var(--accent-warm)]/20 to-violet-600/20 flex items-center justify-center">
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="absolute top-4 right-4 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-colors"
              >
                <X size={16} />
              </button>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={sponsor.name}
                  className="max-h-16 max-w-[70%] object-contain"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              ) : (
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                  {sponsor.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Contenido */}
            <div className="px-6 pt-5 pb-6">
              {tierMeta && (
                <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${tierMeta.className}`}>
                  {tierMeta.label}
                </span>
              )}
              {categoryLabel && (
                <span className="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border bg-white/5 text-white/60 border-white/10">
                  {categoryLabel}
                </span>
              )}

              <h3 className="text-2xl font-bold text-white mt-3 mb-3">{sponsor.name}</h3>

              {sponsor.resena && (
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-5">
                  {sponsor.resena}
                </p>
              )}

              <div className="space-y-3">
                {sponsor.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={16} className="text-[var(--accent-warm)]" />
                    <a
                      href={`mailto:${sponsor.email}`}
                      className="text-[var(--text-secondary)] hover:text-white transition-colors"
                    >
                      {sponsor.email}
                    </a>
                  </div>
                )}

                {sponsor.website_url && (
                  <a
                    href={sponsor.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent-warm)] text-gray-900 text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    <ExternalLink size={14} />
                    Visitar sitio web
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}