'use client'

import { useState } from 'react'

export function PublicIdeasForm() {
  const [ideaText, setIdeaText] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [authorPhone, setAuthorPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const fd = new FormData()
    fd.set('idea_text', ideaText)
    fd.set('is_anonymous', String(isAnonymous))
    fd.set('author_name', authorName)
    fd.set('author_email', authorEmail)
    fd.set('author_phone', authorPhone)

    try {
      const res = await fetch('/api/ideas', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success) {
        setSubmitted(true)
      } else {
        setError(data.error || 'Error al enviar la idea.')
      }
    } catch {
      setError('Error de conexión.')
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="glass rounded-2xl p-8 text-center border border-green-500/20">
        <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-white font-semibold text-lg mb-1">¡Idea enviada!</h3>
        <p className="text-[var(--text-muted)] text-sm">Gracias por contribuir. El equipo la revisará pronto.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 border border-[var(--border-subtle)] text-left max-w-xl mx-auto">
      <h3 className="text-white font-semibold text-base mb-4">Dejá tu propuesta</h3>

      <div className="mb-4">
        <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Tu idea *</label>
        <textarea
          value={ideaText}
          onChange={e => setIdeaText(e.target.value)}
          placeholder="Contanos tu inquietud, propuesta o sugerencia..."
          rows={4}
          required
          minLength={10}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--accent-primary)] resize-none"
        />
      </div>

      <label className="flex items-center gap-3 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={e => setIsAnonymous(e.target.checked)}
          className="w-4 h-4 rounded border-white/20 bg-white/5"
        />
        <span className="text-xs text-[var(--text-secondary)]">Enviar de forma anónima</span>
      </label>

      {!isAnonymous && (
        <div className="space-y-3 mb-4">
          <input
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
            placeholder="Tu nombre (opcional)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--accent-primary)]"
          />
          <input
            value={authorEmail}
            onChange={e => setAuthorEmail(e.target.value)}
            placeholder="Email (opcional)"
            type="email"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--accent-primary)]"
          />
          <input
            value={authorPhone}
            onChange={e => setAuthorPhone(e.target.value)}
            placeholder="Teléfono (opcional)"
            type="tel"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>
      )}

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      <button
        type="submit"
        disabled={loading || ideaText.length < 10}
        className="w-full btn-primary py-3 rounded-xl text-sm font-bold disabled:opacity-40"
      >
        {loading ? 'Enviando...' : 'Enviar idea'}
      </button>
    </form>
  )
}
