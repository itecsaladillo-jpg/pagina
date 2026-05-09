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
    rubro: sponsor?.rubro || '',
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
      <div className="glass border border-white/10 rounded-2xl p-8 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-white mb-6">
          {sponsor ? 'Editar Socio' : 'Nuevo Socio Estratégico'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Nombre de la Organización *</label>
            <input required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--accent-primary)] outline-none"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Rubro / Sector</label>
            <input placeholder="Ej: tecnología, agroindustria, salud"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--accent-primary)] outline-none"
              value={formData.rubro}
              onChange={e => setFormData({ ...formData, rubro: e.target.value })} />
            <p className="text-[10px] text-gray-500 mt-1">Se usará para identificar actividades relevantes para este socio.</p>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Resumen de Impacto (IA)</label>
            <textarea rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--accent-primary)] outline-none text-sm italic"
              placeholder="Redactá manualmente o generalo con IA en la sección de Reportes..."
              value={formData.ai_summary}
              onChange={e => setFormData({ ...formData, ai_summary: e.target.value })} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Alumnos', key: 'alumnos' },
              { label: 'Capacitaciones', key: 'capacitaciones' },
              { label: 'Horas', key: 'horas' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">{f.label}</label>
                <input type="number"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[var(--accent-primary)] outline-none"
                  value={formData.impact_data[f.key]}
                  onChange={e => setFormData({ ...formData, impact_data: { ...formData.impact_data, [f.key]: parseInt(e.target.value) || 0 } })} />
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-all text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-8 py-3 rounded-xl btn-primary text-sm font-black">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
