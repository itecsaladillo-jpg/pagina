'use client'

import { useState, useTransition } from 'react'
import { processTextAction, type ProcessTextResult } from '../actions'

interface Commission {
  id: string
  name: string
}

interface Props {
  commissions: Commission[]
}

const SOURCE_TYPES = [
  { value: 'meet', label: 'Transcripción de Meet' },
  { value: 'capacitacion', label: 'Capacitación' },
  { value: 'reunion', label: 'Reunión Presencial' },
  { value: 'manual', label: 'Redacción Manual' },
]

export function AIProcessorForm({ commissions }: Props) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<ProcessTextResult | null>(null)
  const [charCount, setCharCount] = useState(0)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setResult(null)
      const res = await processTextAction(formData)
      setResult(res)
    })
  }

  return (
    <div className="space-y-6">
      <form action={handleSubmit} className="space-y-4">
        {/* Título */}
        <div>
          <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
            Título del Flash *
          </label>
          <input
            name="title"
            type="text"
            required
            placeholder="Ej: Reunión de Comisión Tecnología — Mayo 2025"
            className="w-full bg-black/40 border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
          />
        </div>

        {/* Fila: Tipo de Fuente + Comisión */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Tipo de Fuente
            </label>
            <select
              name="sourceType"
              defaultValue="meet"
              className="w-full bg-black/40 border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
            >
              {SOURCE_TYPES.map((s) => (
                <option key={s.value} value={s.value} className="bg-black">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Comisión (opcional)
            </label>
            <select
              name="commissionId"
              className="w-full bg-black/40 border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
            >
              <option value="" className="bg-black">General (todas las comisiones)</option>
              {commissions.map((c) => (
                <option key={c.id} value={c.id} className="bg-black">{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Texto a procesar */}
        <div>
          <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">
            Texto a Procesar * ({charCount} caracteres)
          </label>
          <textarea
            name="text"
            required
            rows={8}
            onChange={(e) => setCharCount(e.target.value.length)}
            placeholder="Pegá acá la transcripción del Meet, el resumen de la reunión o el texto que querés que la IA procese..."
            className="w-full bg-black/40 border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors resize-none font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="btn-primary text-sm px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span>Procesando con IA...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
              <span>Procesar con Gemini IA</span>
            </>
          )}
        </button>
      </form>

      {/* Error */}
      {result && !result.success && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
          {result.error}
        </div>
      )}

      {/* Resultado exitoso */}
      {result?.success && result.data && (
        <div className="space-y-4 animate-fade-up">
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Flash publicado exitosamente
          </div>

          {/* Flash informativo */}
          <div className="glass border border-[var(--accent-primary)]/30 rounded-xl p-5">
            <span className="text-xs text-[var(--accent-primary-2)] uppercase tracking-wider font-medium">Flash Informativo</span>
            <p className="text-white mt-2 leading-relaxed">{result.data.flash_text}</p>
          </div>

          {/* Resumen */}
          <div className="glass border border-[var(--border-subtle)] rounded-xl p-5">
            <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">Resumen Ejecutivo</span>
            <p className="text-[var(--text-secondary)] mt-2 text-sm leading-relaxed">{result.data.summary}</p>
          </div>

          {/* Action Items */}
          {result.data.action_items.length > 0 && (
            <div className="glass border border-[var(--border-subtle)] rounded-xl p-5">
              <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">Tareas Pendientes</span>
              <ul className="mt-3 space-y-2">
                {result.data.action_items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="text-[var(--accent-primary-2)] mt-0.5 flex-shrink-0">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
