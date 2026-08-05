'use client'

import { useState, useTransition, useCallback } from 'react'
import { updateSettingAction } from './actions'
import { Eye, EyeOff, Save, Loader2, CheckCircle2 } from 'lucide-react'

interface Props {
  settings: Record<string, string>
}

interface KeyDef {
  key: string
  label: string
  description: string
}

const API_KEYS: KeyDef[] = [
  {
    key: 'openrouter_api_key',
    label: 'OpenRouter API Key',
    description: 'Gateway unificado a múltiples modelos de IA (DeepSeek, Claude, GPT, etc.)',
  },
  {
    key: 'gemini_api_key',
    label: 'Gemini API Key',
    description: 'Modelos de Google para generación de texto y embeddings',
  },
  {
    key: 'resend_api_key',
    label: 'Resend API Key',
    description: 'Servicio de envío de emails transaccionales',
  },
  {
    key: 'groq_api_key',
    label: 'Groq API Key',
    description: ' Inferencia ultrarrápida con modelos open-source (Llama, Mixtral)',
  },
  {
    key: 'hf_api_key',
    label: 'HuggingFace API Key',
    description: 'Embeddings y modelos open-source vía Inference API',
  },
]

export function ApiKeysSettingsForm({ settings }: Props) {
  return (
    <div className="space-y-1">
      {API_KEYS.map((def) => (
        <ApiKeyRow key={def.key} def={def} initialValue={settings[def.key] || ''} />
      ))}
    </div>
  )
}

function ApiKeyRow({ def, initialValue }: { def: KeyDef; initialValue: string }) {
  const [value, setValue] = useState('')
  const [showValue, setShowValue] = useState(false)
  const [hasValue] = useState(() => initialValue.length > 0)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const masked = hasValue
    ? initialValue.slice(0, 4) + '•'.repeat(Math.min(initialValue.length - 7, 20)) + initialValue.slice(-3)
    : ''

  const handleSave = useCallback(() => {
    setError(null)
    setSaved(false)

    startTransition(async () => {
      const res = await updateSettingAction(def.key, value.trim())
      if (res.success) {
        setSaved(true)
        setValue('')
        setShowValue(false)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(res.error || 'Error al guardar.')
        setTimeout(() => setError(null), 4000)
      }
    })
  }, [def.key, value, startTransition])

  const hasEdited = value.length > 0

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--border-subtle)]/50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-white text-sm font-medium">{def.label}</span>
          {hasValue && !hasEdited && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
              {initialValue.slice(0, 4)}••••{initialValue.slice(-3)}
            </span>
          )}
        </div>
        <p className="text-[var(--text-muted)] text-[11px] leading-snug">{def.description}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <input
            type={showValue ? 'text' : 'password'}
            placeholder={hasValue ? masked : 'No configurado'}
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter' && hasEdited) handleSave() }}
            className="w-64 bg-white/5 border border-[var(--border-subtle)] rounded-lg px-3 pr-9 py-2 text-white text-sm font-mono placeholder:text-[var(--text-muted)]/50 focus:border-[var(--accent-primary)] outline-none transition-all"
          />
          <button
            type="button"
            onClick={() => setShowValue(!showValue)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
          >
            {showValue ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!hasEdited || isPending}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            backgroundColor: saved
              ? 'rgba(34, 197, 94, 0.15)'
              : error
              ? 'rgba(239, 68, 68, 0.15)'
              : 'rgba(59, 130, 246, 0.15)',
            color: saved
              ? '#4ade80'
              : error
              ? '#f87171'
              : '#60a5fa',
            border: `1px solid ${
              saved
                ? 'rgba(34, 197, 94, 0.2)'
                : error
                ? 'rgba(239, 68, 68, 0.2)'
                : 'rgba(59, 130, 246, 0.2)'
            }`,
          }}
        >
          {isPending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : saved ? (
            <CheckCircle2 size={13} />
          ) : (
            <Save size={13} />
          )}
          {isPending ? 'Guardando...' : saved ? '¡Guardado!' : error ? 'Error' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
