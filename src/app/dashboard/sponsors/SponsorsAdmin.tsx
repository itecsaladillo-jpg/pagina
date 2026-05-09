'use client'

import { useState } from 'react'
import { SponsorForm } from './SponsorForm'
import { createAccionAction, deleteAccionAction, deleteSponsorAction, createReporteAction } from './actions'
import { generateInvitationAction } from '../actions/invitations'

const CATEGORIAS = [
  { value: 'ciencia', label: '🔬 Ciencia', },
  { value: 'robotica', label: '🤖 Robótica' },
  { value: 'capacitacion', label: '📚 Capacitación' },
  { value: 'traslado', label: '✈️ Logística/Traslado' },
  { value: 'equipamiento', label: '🛠️ Equipamiento' },
  { value: 'general', label: '⚡ General' },
]

interface Props {
  initialSponsors: any[]
  initialAcciones: any[]
}

export function SponsorsAdmin({ initialSponsors, initialAcciones }: Props) {
  const [sponsors, setSponsors] = useState(initialSponsors)
  const [acciones, setAcciones] = useState(initialAcciones)
  const [activeTab, setActiveTab] = useState<'sponsors' | 'acciones' | 'reportes'>('sponsors')
  const [showSponsorForm, setShowSponsorForm] = useState(false)
  const [editingSponsor, setEditingSponsor] = useState<any>(null)
  const [showAccionForm, setShowAccionForm] = useState(false)
  const [loadingAccion, setLoadingAccion] = useState(false)

  // Estado del formulario de nueva acción
  const [accionForm, setAccionForm] = useState({
    titulo: '', descripcion: '', categoria: 'general',
    fecha: new Date().toISOString().split('T')[0],
    presupuesto_total: 0, impacto_social: '',
    trascendencia_regional: '', rubros_relacionados: ''
  })

  // Estado de generación de reporte
  const [reporteForm, setReporteForm] = useState({
    sponsor_id: '', periodo: '', acciones_ids: [] as string[],
    fondo_comun_detalle: { viaticos: 0, hoteleria: 0, insumos: 0, otros: 0 }
  })
  const [loadingReporte, setLoadingReporte] = useState(false)
  const [reporteGenerado, setReporteGenerado] = useState<any>(null)

  const handleDeleteAccion = async (id: string) => {
    if (!confirm('¿Eliminár esta acción?')) return
    await deleteAccionAction(id)
    setAcciones(acciones.filter(a => a.id !== id))
  }

  const handleCreateAccion = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingAccion(true)
    try {
      const res = await createAccionAction({
        ...accionForm,
        rubros_relacionados: accionForm.rubros_relacionados.split(',').map(r => r.trim().toLowerCase()).filter(Boolean)
      })
      setAcciones([res.data, ...acciones])
      setShowAccionForm(false)
      setAccionForm({ titulo: '', descripcion: '', categoria: 'general', fecha: new Date().toISOString().split('T')[0], presupuesto_total: 0, impacto_social: '', trascendencia_regional: '', rubros_relacionados: '' })
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
    setLoadingAccion(false)
  }

  const handleGenerarReporte = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingReporte(true)
    try {
      const res = await createReporteAction(reporteForm)
      setReporteGenerado(res.data)
      alert('¡Reporte generado con éxito! La IA redactó el resumen de trascendencia.')
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
    setLoadingReporte(false)
  }

  const handleInvite = async (sponsor: any) => {
    const res = await generateInvitationAction({ recipientName: sponsor.name, type: 'sponsor', title: 'Reporte de Impacto', linkId: sponsor.id })
    window.open(res.whatsappUrl, '_blank')
  }

  const TABS = [
    { id: 'sponsors', label: 'Socios Estratégicos', count: sponsors.length },
    { id: 'acciones', label: 'Acciones del ITEC', count: acciones.length },
    { id: 'reportes', label: 'Generar Reporte', count: null },
  ]

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-[var(--border-subtle)] pb-px">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-2 text-sm font-medium transition-all relative ${activeTab === tab.id ? 'text-white' : 'text-[var(--text-muted)] hover:text-white'}`}>
            {tab.label}
            {tab.count !== null && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-white/10">{tab.count}</span>
            )}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]" />}
          </button>
        ))}
      </div>

      {/* ─── TAB: SPONSORS ─── */}
      {activeTab === 'sponsors' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => { setEditingSponsor(null); setShowSponsorForm(true) }}
              className="btn-primary text-xs py-2 px-6 rounded-xl">+ Nuevo Socio</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sponsors.map(s => (
              <div key={s.id} className="glass border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{s.name}</h3>
                    {s.rubro && <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-0.5">Rubro: {s.rubro}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingSponsor(s); setShowSponsorForm(true) }}
                      className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button onClick={() => deleteSponsorAction(s.id).then(() => setSponsors(sponsors.filter(x => x.id !== s.id)))}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-400 transition-all">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {s.ai_summary && <p className="text-gray-400 text-xs italic mb-6 line-clamp-2">"{s.ai_summary}"</p>}

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <a href={`/sponsors/${s.id}`} target="_blank"
                    className="text-[10px] text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-all">
                    Ver Portal →
                  </a>
                  <button onClick={() => handleInvite(s)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-green-400 hover:text-green-300 uppercase tracking-widest transition-all">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .014 5.398 0 12.03c0 2.12.554 4.189 1.604 6.03l-1.704 6.223 6.366-1.67a11.803 11.803 0 005.725 1.486h.005c6.634 0 12.032-5.398 12.036-12.032.002-3.213-1.248-6.234-3.518-8.504z" />
                    </svg>
                    WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
          {showSponsorForm && <SponsorForm sponsor={editingSponsor} onClose={() => setShowSponsorForm(false)} />}
        </div>
      )}

      {/* ─── TAB: ACCIONES ─── */}
      {activeTab === 'acciones' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => setShowAccionForm(true)} className="btn-primary text-xs py-2 px-6 rounded-xl">
              + Registrar Acción
            </button>
          </div>

          {showAccionForm && (
            <div className="glass border border-white/10 rounded-2xl p-8 space-y-6">
              <h3 className="text-xl font-bold">Nueva Acción ITEC</h3>
              <form onSubmit={handleCreateAccion} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Título</label>
                  <input required className="w-full input-field" value={accionForm.titulo}
                    onChange={e => setAccionForm({ ...accionForm, titulo: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Categoría</label>
                  <select className="w-full input-field" value={accionForm.categoria}
                    onChange={e => setAccionForm({ ...accionForm, categoria: e.target.value })}>
                    {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Fecha</label>
                  <input type="date" className="w-full input-field" value={accionForm.fecha}
                    onChange={e => setAccionForm({ ...accionForm, fecha: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Presupuesto (ARS)</label>
                  <input type="number" className="w-full input-field" value={accionForm.presupuesto_total}
                    onChange={e => setAccionForm({ ...accionForm, presupuesto_total: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Impacto Social</label>
                  <input placeholder="Ej: 2 científicos + 40 participantes" className="w-full input-field" value={accionForm.impacto_social}
                    onChange={e => setAccionForm({ ...accionForm, impacto_social: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Trascendencia Regional</label>
                  <input placeholder="Ej: Posiciona a Saladillo como nodo de transferencia científica" className="w-full input-field" value={accionForm.trascendencia_regional}
                    onChange={e => setAccionForm({ ...accionForm, trascendencia_regional: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Descripción</label>
                  <textarea rows={3} className="w-full input-field" value={accionForm.descripcion}
                    onChange={e => setAccionForm({ ...accionForm, descripcion: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Rubros Relacionados (separados por coma)</label>
                  <input placeholder="Ej: tecnología, educación, industria" className="w-full input-field" value={accionForm.rubros_relacionados}
                    onChange={e => setAccionForm({ ...accionForm, rubros_relacionados: e.target.value })} />
                </div>
                <div className="md:col-span-2 flex gap-4">
                  <button type="button" onClick={() => setShowAccionForm(false)} className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-sm">Cancelar</button>
                  <button type="submit" disabled={loadingAccion} className="flex-1 btn-primary py-3 rounded-xl text-sm">
                    {loadingAccion ? 'Registrando...' : 'Registrar Acción'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid gap-4">
            {acciones.map(a => (
              <div key={a.id} className="glass border border-white/5 rounded-xl p-5 flex items-center justify-between group hover:border-white/10 transition-all">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{
                    a.categoria === 'ciencia' ? '🔬' : a.categoria === 'robotica' ? '🤖' :
                    a.categoria === 'capacitacion' ? '📚' : a.categoria === 'traslado' ? '✈️' :
                    a.categoria === 'equipamiento' ? '🛠️' : '⚡'
                  }</span>
                  <div>
                    <p className="font-semibold text-white text-sm">{a.titulo}</p>
                    <p className="text-[var(--text-muted)] text-[11px] mt-0.5">{a.impacto_social || 'Sin datos de impacto'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-white/60 text-xs font-mono hidden md:block">
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(a.presupuesto_total || 0)}
                  </p>
                  <button onClick={() => handleDeleteAccion(a.id)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-400 transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB: REPORTES ─── */}
      {activeTab === 'reportes' && (
        <div className="space-y-6">
          <div className="glass border border-white/10 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-2">Generar Reporte de Trascendencia</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-8">
              Seleccioná el sponsor, las acciones del período y la distribución del fondo común. La IA redactará el texto persuasivo del reporte.
            </p>

            <form onSubmit={handleGenerarReporte} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Sponsor</label>
                  <select required className="w-full input-field" value={reporteForm.sponsor_id}
                    onChange={e => setReporteForm({ ...reporteForm, sponsor_id: e.target.value })}>
                    <option value="">— Seleccionar socio —</option>
                    {sponsors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Período</label>
                  <input required placeholder="Ej: Mayo 2025" className="w-full input-field" value={reporteForm.periodo}
                    onChange={e => setReporteForm({ ...reporteForm, periodo: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-3">Acciones del Período</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {acciones.map(a => (
                    <label key={a.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all">
                      <input type="checkbox" className="rounded"
                        checked={reporteForm.acciones_ids.includes(a.id)}
                        onChange={e => setReporteForm({
                          ...reporteForm,
                          acciones_ids: e.target.checked
                            ? [...reporteForm.acciones_ids, a.id]
                            : reporteForm.acciones_ids.filter(id => id !== a.id)
                        })} />
                      <span className="text-sm text-white">{a.titulo}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-3">Distribución del Fondo Común (ARS)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['viaticos', 'hoteleria', 'insumos', 'otros'].map(key => (
                    <div key={key}>
                      <label className="block text-[10px] text-gray-500 mb-1 capitalize">{key}</label>
                      <input type="number" className="w-full input-field"
                        value={(reporteForm.fondo_comun_detalle as any)[key]}
                        onChange={e => setReporteForm({
                          ...reporteForm,
                          fondo_comun_detalle: { ...reporteForm.fondo_comun_detalle, [key]: parseFloat(e.target.value) || 0 }
                        })} />
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loadingReporte || !reporteForm.sponsor_id || reporteForm.acciones_ids.length === 0}
                className="w-full btn-primary py-4 rounded-xl text-sm font-black disabled:opacity-40">
                {loadingReporte ? '✨ Generando con IA...' : '✨ Generar Reporte con IA'}
              </button>
            </form>

            {reporteGenerado && (
              <div className="mt-6 p-6 border border-green-500/20 bg-green-500/5 rounded-xl">
                <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-2">Reporte Generado</p>
                <p className="text-white text-sm italic">{reporteGenerado.ai_reporte || 'Reporte guardado. El texto IA se generará cuando esté configurada la API Key.'}</p>
                {reporteForm.sponsor_id && (
                  <a href={`/sponsors/${reporteForm.sponsor_id}`} target="_blank"
                    className="inline-block mt-4 text-xs text-blue-400 hover:text-blue-300 underline">
                    Ver portal del sponsor →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        .input-field {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 16px;
          color: white;
          font-size: 14px;
          transition: border-color 0.2s;
          width: 100%;
        }
        .input-field:focus {
          outline: none;
          border-color: var(--accent-primary);
        }
        .input-field option {
          background: #111;
        }
      `}</style>
    </div>
  )
}
