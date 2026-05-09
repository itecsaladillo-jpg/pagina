'use client'

import { useState } from 'react'
import { SponsorForm } from './SponsorForm'
import { deleteSponsorAction } from './actions'
import { generateInvitationAction } from '../actions/invitations'

export function SponsorsList({ initialSponsors }: { initialSponsors: any[] }) {
  const [sponsors, setSponsors] = useState(initialSponsors)
  const [showForm, setShowForm] = useState(false)
  const [editingSponsor, setEditingSponsor] = useState<any>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que querés eliminar este sponsor?')) return
    await deleteSponsorAction(id)
    setSponsors(sponsors.filter(s => s.id !== id))
  }

  const handleInvite = async (sponsor: any) => {
    const res = await generateInvitationAction({
      recipientName: sponsor.name,
      type: 'sponsor',
      title: 'Reporte de Impacto',
      linkId: sponsor.id
    })
    window.open(res.whatsappUrl, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingSponsor(null)
            setShowForm(true)
          }}
          className="btn-primary text-xs py-2 px-6 rounded-xl"
        >
          + Nuevo Sponsor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sponsors.map((s) => (
          <div key={s.id} className="glass border border-white/5 rounded-2xl p-6 flex flex-col hover:border-white/10 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{s.name}</h3>
                <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest mt-1">Socio Estratégico</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setEditingSponsor(s)
                    setShowForm(true)
                  }}
                  className="p-2 hover:bg-white/5 rounded-lg text-white/50 hover:text-white transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button 
                  onClick={() => handleDelete(s.id)}
                  className="p-2 hover:bg-red-500/10 rounded-lg text-white/50 hover:text-red-400 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 mb-6">
              <p className="text-[var(--text-secondary)] text-sm italic line-clamp-2">
                "{s.ai_summary || 'Sin resumen de impacto cargado.'}"
              </p>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-sm font-bold text-white">{s.impact_data?.alumnos || 0}</p>
                  <p className="text-[8px] text-[var(--text-muted)] uppercase tracking-tighter">Alumnos</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white">{s.impact_data?.capacitaciones || 0}</p>
                  <p className="text-[8px] text-[var(--text-muted)] uppercase tracking-tighter">Capacit.</p>
                </div>
              </div>
              
              <button
                onClick={() => handleInvite(s)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--accent-primary-2)] hover:text-white transition-all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .014 5.398 0 12.03c0 2.12.554 4.189 1.604 6.03l-1.704 6.223 6.366-1.67a11.803 11.803 0 005.725 1.486h.005c6.634 0 12.032-5.398 12.036-12.032.002-3.213-1.248-6.234-3.518-8.504z" />
                </svg>
                Enviar Invitación
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <SponsorForm 
          sponsor={editingSponsor} 
          onClose={() => {
            setShowForm(false)
            setEditingSponsor(null)
          }} 
        />
      )}
    </div>
  )
}
