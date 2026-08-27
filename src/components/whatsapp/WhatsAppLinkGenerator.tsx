'use client'

import { useCallback } from 'react'
import { Copy, ExternalLink, Phone } from 'lucide-react'

// Número institucional ITEC Saladillo
export const ITEC_WHATSAPP_NUMBER = '5492344547030'

/**
 * Normaliza un número argentino al formato requerido por wa.me:
 * +54 9 XXXXXXXXXX → 549XXXXXXXXXX (sin +, sin espacios, sin guiones)
 */
export function normalizeArgentinaPhone(raw: string): string {
  // Eliminar todo lo que no sea dígito
  let digits = raw.replace(/\D/g, '')

  // Si empieza con 0 (ej: 02344...), quitar el 0 inicial
  if (digits.startsWith('0')) digits = digits.slice(1)

  // Si no empieza con 54, agregar código de país Argentina
  if (!digits.startsWith('54')) {
    // Números móviles argentinos necesitan el 9 intercalado: 54 9 XXXXXXXXXX
    if (!digits.startsWith('9')) {
      digits = '549' + digits
    } else {
      digits = '54' + digits
    }
  }

  // Algunos casos vienen como 5402344... → reemplazar 540 por 549
  if (digits.startsWith('540') && digits.length === 13) {
    digits = '549' + digits.slice(3)
  }

  return digits
}

/**
 * Genera un link wa.me con texto opcional pre-cargado.
 */
export function buildWaLink(phone: string, text?: string): string {
  const normalized = normalizeArgentinaPhone(phone)
  const base = `https://wa.me/${normalized}`
  if (!text) return base
  return `${base}?text=${encodeURIComponent(text)}`
}

interface WhatsAppLinkGeneratorProps {
  phone: string
  recipientName?: string
  text?: string
  /** Si true, muestra el número normalizado debajo del link */
  showNormalized?: boolean
  compact?: boolean
  onOpen?: () => void
}

export function WhatsAppLinkGenerator({
  phone,
  recipientName,
  text,
  showNormalized = false,
  compact = false,
  onOpen,
}: WhatsAppLinkGeneratorProps) {
  const link = buildWaLink(phone, text)
  const normalized = normalizeArgentinaPhone(phone)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      // fallback
      const el = document.createElement('textarea')
      el.value = link
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
  }, [link])

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onOpen}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#25d366]/10 hover:bg-[#25d366]/20 border border-[#25d366]/20 hover:border-[#25d366]/40 text-[#25d366] text-xs font-medium transition-all"
          title={`Abrir WhatsApp con ${recipientName ?? phone}`}
        >
          <WhatsAppIcon size={12} />
          Abrir
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-white transition-all"
          title="Copiar link"
        >
          <Copy size={12} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {recipientName && (
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Phone size={14} className="text-[#25d366]" />
          <span className="font-medium text-white">{recipientName}</span>
          {showNormalized && (
            <span className="text-[var(--text-muted)] font-mono text-xs">+{normalized}</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onOpen}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25d366]/10 hover:bg-[#25d366]/20 border border-[#25d366]/25 hover:border-[#25d366]/50 text-[#25d366] font-semibold text-sm transition-all duration-200 group"
        >
          <WhatsAppIcon size={16} />
          Abrir en WhatsApp Web
          <ExternalLink size={12} className="opacity-60 group-hover:opacity-100 transition-opacity" />
        </a>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[var(--text-muted)] hover:text-white text-sm transition-all"
          title="Copiar link al portapapeles"
        >
          <Copy size={14} />
          Copiar link
        </button>
      </div>

      {showNormalized && !recipientName && (
        <p className="text-[var(--text-muted)] text-xs font-mono">+{normalized}</p>
      )}
    </div>
  )
}

// SVG del ícono de WhatsApp (oficial)
export function WhatsAppIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.406A9.944 9.944 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 0 1-4.333-1.279l-.31-.184-3.118.88.846-3.048-.201-.313A7.954 7.954 0 0 1 4 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z" />
    </svg>
  )
}
