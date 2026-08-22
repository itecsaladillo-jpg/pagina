'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, X } from 'lucide-react'
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-[#0a0f1e] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
    >
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

      <div className="px-6 pt-5 pb-6 text-center">
        <h3 className="text-2xl font-bold text-white mb-3">{name}</h3>

        {description && (
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-5">
            {description}
          </p>
        )}

        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent-warm)] text-gray-900 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <ExternalLink size={14} />
            Visitar sitio web
          </a>
        )}
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

  return (
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
    </AnimatePresence>
  )
}
