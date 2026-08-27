'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, X, Mail, Tag, Phone, MapPin, Building2, Radio, User } from 'lucide-react'
import type { PartnerEntity } from '@/types/database'

interface Props {
  isOpen: boolean
  onClose: () => void
  entity: PartnerEntity | null
}

function textField(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

function pickField(entity: PartnerEntity, ...keys: string[]): string | null {
  const record = entity as unknown as Record<string, unknown>
  for (const key of keys) {
    const value = textField(record[key])
    if (value) return value
  }
  return null
}

function ModalPanel({ entity, onClose }: { entity: PartnerEntity; onClose: () => void }) {
  const name = pickField(entity, 'name', 'nombre_medio') ?? ''
  const logoUrl = pickField(entity, 'logo_color_url', 'logo_url')
  const description = pickField(entity, 'resena', 'actions_description', 'description')
  const websiteUrl = pickField(entity, 'url_web', 'website_url')
  const email = pickField(entity, 'email')
  const category = pickField(entity, 'category', 'tipo_medio')
  const rubro = pickField(entity, 'rubro')
  const telefono = pickField(entity, 'telefono', 'contacto_telefono')
  const zonaInfluencia = pickField(entity, 'zona_influencia')
  const actividad = pickField(entity, 'actividad')
  const contactoNombre = pickField(entity, 'contacto_nombre', 'nombre_contacto')
  const contactoApellido = pickField(entity, 'apellido_contacto')
  const dialRadio = pickField(entity, 'dial_radio')
  const tier = typeof entity === 'object' && entity !== null && 'tier' in entity
    ? (entity as { tier: string | null }).tier
    : null
  const type = typeof entity === 'object' && entity !== null && 'type' in entity
    ? (entity as { type: string }).type
    : null

  const typeLabels: Record<string, string> = {
    SPONSOR: 'Sponsor',
    STRATEGIC_ALLIANCE: 'Alianza Estratégica',
    DIFFUSION_CHANNEL: 'Canal de Difusión',
  }

  const tierLabels: Record<string, string> = {
    platino: 'Platino',
    oro: 'Oro',
    plata: 'Plata',
    bronce: 'Bronce',
    standard: 'Standard',
  }

  const contactoFull = [contactoNombre, contactoApellido].filter(Boolean).join(' ') || null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-[#0a0f1e] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[calc(100vh-2rem)] flex flex-col"
    >
      <div className="relative h-36 bg-gradient-to-r from-[var(--accent-warm)]/20 to-violet-600/20 flex items-center justify-center flex-shrink-0">
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
            alt={name}
            className="max-h-16 max-w-[70%] object-contain"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ) : (
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="px-6 pt-5 pb-6 overflow-y-auto flex-1">
        <div className="text-center mb-4">
          <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {type && typeLabels[type] && (
              <span className="text-[10px] font-medium text-[var(--accent-warm)] bg-[var(--accent-warm)]/10 px-3 py-1 rounded-full border border-[var(--accent-warm)]/20">
                {typeLabels[type]}
              </span>
            )}
            {tier && tierLabels[tier] && (
              <span className="text-[10px] font-medium text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                {tierLabels[tier]}
              </span>
            )}
            {category && (
              <span className="text-[10px] font-medium text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">
                {category}
              </span>
            )}
            {rubro && (
              <span className="text-[10px] font-medium text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
                {rubro}
              </span>
            )}
          </div>
        </div>

        {description && (
          <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              {description}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {actividad && (
            <div className="flex items-center gap-3 text-sm">
              <Building2 size={16} className="text-[var(--accent-warm)]" />
              <span className="text-[var(--text-secondary)]">{actividad}</span>
            </div>
          )}

          {contactoFull && (
            <div className="flex items-center gap-3 text-sm">
              <User size={16} className="text-[var(--accent-warm)]" />
              <span className="text-[var(--text-secondary)]">{contactoFull}</span>
            </div>
          )}

          {email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-[var(--accent-warm)]" />
              <a href={`mailto:${email}`} className="text-[var(--text-secondary)] hover:text-white transition-colors">
                {email}
              </a>
            </div>
          )}

          {telefono && (
            <div className="flex items-center gap-3 text-sm">
              <Phone size={16} className="text-[var(--accent-warm)]" />
              <a href={`tel:${telefono}`} className="text-[var(--text-secondary)] hover:text-white transition-colors">
                {telefono}
              </a>
            </div>
          )}

          {dialRadio && (
            <div className="flex items-center gap-3 text-sm">
              <Radio size={16} className="text-[var(--accent-warm)]" />
              <span className="text-[var(--text-secondary)]">{dialRadio}</span>
            </div>
          )}

          {zonaInfluencia && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin size={16} className="text-[var(--accent-warm)]" />
              <span className="text-[var(--text-secondary)]">{zonaInfluencia}</span>
            </div>
          )}

          {category && (
            <div className="flex items-center gap-3 text-sm">
              <Tag size={16} className="text-[var(--accent-warm)]" />
              <span className="text-[var(--text-secondary)]">{category}</span>
            </div>
          )}

          {websiteUrl && (
            <div className="pt-2">
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent-warm)] text-gray-900 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <ExternalLink size={14} />
                Visitar sitio web
              </a>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function SponsorModal({ isOpen, onClose, entity }: Props) {
  useEffect(() => {
    if (!isOpen) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && entity && (
        <motion.div
          key="socios-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <ModalPanel entity={entity} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
