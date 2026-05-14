'use client'

import { useState } from 'react'
import { updateProfileAction } from './actions'

interface Props {
  member: any
}

export function ProfileForm({ member }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: member.full_name || '',
    email: member.email || '',
    phone: member.phone || '',
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const res = await updateProfileAction(formData)
    if (res.success) {
      setMessage({ type: 'success', text: 'Perfil actualizado con éxito.' })
    } else {
      setMessage({ type: 'error', text: res.error || 'Error al actualizar el perfil.' })
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {message && (
        <div className={`p-4 rounded-lg text-sm font-medium ${
          message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-bold">
          Nombre y Apellido
        </label>
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm focus:border-[var(--accent-primary)] outline-none transition-all"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-bold">
          Correo Electrónico
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm focus:border-[var(--accent-primary)] outline-none transition-all"
          required
        />
        <p className="text-[var(--text-muted)] text-[10px] italic">
          * Importante: El correo debe coincidir con tu cuenta de Google para evitar problemas de acceso.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-bold">
          Teléfono
        </label>
        <input
          type="text"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+54 9 11 ..."
          className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm focus:border-[var(--accent-primary)] outline-none transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-4 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.2)]"
      >
        {loading ? 'Guardando cambios...' : 'Guardar Datos Personales'}
      </button>
    </form>
  )
}
