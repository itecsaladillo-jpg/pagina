'use client'

import { useState } from 'react'
import { createSponsorAction, updateSponsorAction } from './actions'

interface Props {
  sponsor?: any
  onClose: () => void
}

export function SponsorForm({ sponsor, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: sponsor?.name || '',
    ai_summary: sponsor?.ai_summary || '',
    impact_data: sponsor?.impact_data || { alumnos: 0, capacitaciones: 0, horas: 0 }
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (sponsor) {
        await updateSponsorAction(sponsor.id, formData)
      } else {
        await createSponsorAction(formData)
      }
      onClose()
    } catch (err) {
      alert('Error al guardar sponsor')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass border border-white/10 rounded-2xl p-8 max-w-xl w-full shadow-2xl">
        <h3 className="text-2xl font-bold text-white mb-6">
          {sponsor ? 'Editar Sponsor' : 'Nuevo Sponsor'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Nombre de la Organización</label>
            <input
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--accent-primary)] outline-none transition-all"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Resumen IA (Logros)</label>
            <textarea
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--accent-primary)] outline-none transition-all text-sm italic"
              placeholder="Ej: Liderazgo en la formación técnica..."
              value={formData.ai_summary}
              onChange={e => setFormData({ ...formData, ai_summary: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Alumnos</label>
              <input
                type="number"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--accent-primary)] outline-none transition-all"
                value={formData.impact_data.alumnos}
                onChange={e => setFormData({ 
                  ...formData, 
                  impact_data: { ...formData.impact_data, alumnos: parseInt(e.target.value) } 
                })}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Capacit.</label>
              <input
                type="number"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--accent-primary)] outline-none transition-all"
                value={formData.impact_data.capacitaciones}
                onChange={e => setFormData({ 
                  ...formData, 
                  impact_data: { ...formData.impact_data, capacitaciones: parseInt(e.target.value) } 
                })}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Horas</label>
              <input
                type="number"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--accent-primary)] outline-none transition-all"
                value={formData.impact_data.horas}
                onChange={e => setFormData({ 
                  ...formData, 
                  impact_data: { ...formData.impact_data, horas: parseInt(e.target.value) } 
                })}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-all text-sm font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 px-8 py-3 rounded-xl bg-[var(--accent-primary)] text-black hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all text-sm font-black uppercase"
            >
              {loading ? 'Guardando...' : 'Guardar Sponsor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
