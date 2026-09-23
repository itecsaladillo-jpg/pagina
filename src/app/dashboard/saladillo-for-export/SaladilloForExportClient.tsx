'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { aprobarTestimonioAction, rechazarTestimonioAction, setEmbajadorAction, eliminarTestimonioAction, crearTestimonioAdminAction } from './actions'

interface Testimonio {
  id: string
  nombre: string
  foto_url: string
  ciudad_residencia: string
  pais_residencia: string
  escuela_origen: string
  profesion_rol: string
  mensaje_gratitud: string
  es_embajador: boolean
  orden_embajador: number | null
  estado: string
  created_at: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  aprobado: { label: 'Aprobado', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  rechazado: { label: 'Rechazado', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export function SaladilloForExportClient({ testimonios: initial }: { testimonios: Testimonio[] }) {
  const [filter, setFilter] = useState('todos')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [local, setLocal] = useState(initial)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const filtered = filter === 'todos' ? local : local.filter(t => t.estado === filter)

  const counts = {
    todos: local.length,
    pendiente: local.filter(t => t.estado === 'pendiente').length,
    aprobado: local.filter(t => t.estado === 'aprobado').length,
    rechazado: local.filter(t => t.estado === 'rechazado').length,
  }

  const handleAction = async (id: string, action: () => Promise<{ success: boolean; error?: string }>) => {
    setError('')
    setLoadingId(id)
    const res = await action()
    if (!res.success) {
      setError(res.error || 'Error al procesar')
    } else {
      setLocal(prev => prev.map(t => {
        if (t.id !== id) return t
        if (action === aprobarTestimonioAction.bind(null, id)) return { ...t, estado: 'aprobado' }
        if (action === rechazarTestimonioAction.bind(null, id)) return { ...t, estado: 'rechazado' }
        return t
      }))
    }
    setLoadingId(null)
  }

  const handleEmbajador = async (id: string, orden: number | null) => {
    setError('')
    setLoadingId(id)
    const res = await setEmbajadorAction(id, orden)
    if (!res.success) {
      setError(res.error || 'Error al asignar embajador')
    } else {
      setLocal(prev => prev.map(t =>
        t.id === id
          ? { ...t, es_embajador: orden !== null, orden_embajador: orden }
          : t
      ))
    }
    setLoadingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este testimonio definitivamente?')) return
    setError('')
    setLoadingId(id)
    const res = await eliminarTestimonioAction(id)
    if (res.success) {
      setLocal(prev => prev.filter(t => t.id !== id))
    } else {
      setError(res.error || 'Error al eliminar')
    }
    setLoadingId(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCreating(true)

    const fd = new FormData(formRef.current!)

    try {
      const res = await crearTestimonioAdminAction(fd)
      if (res.success) {
        formRef.current?.reset()
        setFotoPreview(null)
        setShowForm(false)
        window.location.reload()
      } else {
        setError(res.error || 'Error al crear testimonio')
      }
    } catch {
      setError('Error de conexión')
    }
    setCreating(false)
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Botón crear + Formulario */}
      <div className="glass border border-[var(--border-subtle)] rounded-xl overflow-hidden">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <span className="text-white font-semibold text-sm">Crear testimonio / embajador</span>
          </div>
          <svg className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${showForm ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {showForm && (
          <form ref={formRef} onSubmit={handleCreate} className="px-5 pb-5 border-t border-[var(--border-subtle)] pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Nombre *</label>
                <input name="nombre" required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent-primary)]" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Foto (archivo o URL) *</label>
                <div className="flex items-center gap-2">
                  <input type="file" name="foto" accept="image/jpeg,image/png,image/webp" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-white/10 file:text-white file:text-xs file:cursor-pointer" onChange={e => setFotoPreview(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : null)} />
                </div>
                <input name="foto_url" placeholder="O pegá una URL de imagen" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs mt-2 focus:outline-none focus:border-[var(--accent-primary)]" />
                {fotoPreview && <img src={fotoPreview} alt="Preview" className="w-10 h-10 rounded-lg object-cover mt-2 border border-white/10" />}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Ciudad *</label>
                <input name="ciudad_residencia" required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent-primary)]" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1.5">País *</label>
                <input name="pais_residencia" required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent-primary)]" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Profesión / Rol *</label>
                <input name="profesion_rol" required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent-primary)]" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Escuela/s de Saladillo *</label>
              <input name="escuela_origen" required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent-primary)]" />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Mensaje de gratitud *</label>
              <textarea name="mensaje_gratitud" required rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[var(--accent-primary)] resize-none" />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="es_embajador" value="true" className="w-4 h-4 rounded border-white/20 bg-white/5" />
                <span className="text-xs text-[var(--text-secondary)]">Es embajador ITEC</span>
              </label>
              <div>
                <select name="orden_embajador" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[var(--accent-primary)]">
                  <option value="">Sin posición</option>
                  <option value="1">Embajador #1</option>
                  <option value="2">Embajador #2</option>
                  <option value="3">Embajador #3</option>
                  <option value="4">Embajador #4</option>
                </select>
              </div>
              <div>
                <select name="estado" defaultValue="aprobado" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[var(--accent-primary)]">
                  <option value="aprobado">Aprobado</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-xs font-semibold text-[var(--text-muted)] hover:text-white border border-white/10 hover:border-white/20 transition-all">
                Cancelar
              </button>
              <button type="submit" disabled={creating} className="px-5 py-2 rounded-lg text-xs font-bold bg-green-600 hover:bg-green-500 text-white transition-all disabled:opacity-40">
                {creating ? 'Creando...' : 'Crear testimonio'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'pendiente', label: 'Pendientes' },
          { id: 'aprobado', label: 'Aprobados' },
          { id: 'rechazado', label: 'Rechazados' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
              filter === tab.id
                ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary-2)] border border-[var(--accent-primary)]/30'
                : 'text-[var(--text-muted)] hover:text-white border border-transparent'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-[10px] opacity-60">({counts[tab.id as keyof typeof counts]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass border border-[var(--border-subtle)] rounded-2xl p-12 text-center">
          <p className="text-[var(--text-muted)] text-sm">No hay testimonios en esta categoría.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => {
            const st = statusConfig[t.estado] || statusConfig.pendiente
            return (
              <div key={t.id} className="glass border border-[var(--border-subtle)] rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0">
                    <Image src={t.foto_url} alt={t.nombre} width={56} height={56} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-white font-semibold text-sm">{t.nombre}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${st.color}`}>
                        {st.label}
                      </span>
                      {t.es_embajador && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border bg-amber-500/10 text-amber-400 border-amber-500/20">
                          Embajador #{t.orden_embajador}
                        </span>
                      )}
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {new Date(t.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)] mb-1.5">
                      <span>{t.profesion_rol}</span>
                      <span className="text-[var(--text-muted)]">|</span>
                      <span>{t.ciudad_residencia}, {t.pais_residencia}</span>
                    </div>

                    <p className="text-[11px] text-[var(--text-muted)] mb-1.5">{t.escuela_origen}</p>

                    <p className="text-[var(--text-secondary)] text-xs italic line-clamp-2">&ldquo;{t.mensaje_gratitud}&rdquo;</p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
                    {t.estado !== 'aprobado' && (
                      <button
                        onClick={() => handleAction(t.id, () => aprobarTestimonioAction(t.id))}
                        disabled={loadingId === t.id}
                        className="p-1.5 rounded-lg hover:bg-green-500/10 text-green-400/60 hover:text-green-400 transition-all"
                        title="Aprobar"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                    {t.estado !== 'rechazado' && (
                      <button
                        onClick={() => handleAction(t.id, () => rechazarTestimonioAction(t.id))}
                        disabled={loadingId === t.id}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-all"
                        title="Rechazar"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}

                    <select
                      value={t.orden_embajador ?? ''}
                      onChange={e => {
                        const val = e.target.value
                        handleEmbajador(t.id, val ? Number(val) : null)
                      }}
                      disabled={loadingId === t.id}
                      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)]"
                      title="Asignar posición de embajador"
                    >
                      <option value="">No embajador</option>
                      <option value="1">Embajador #1</option>
                      <option value="2">Embajador #2</option>
                      <option value="3">Embajador #3</option>
                      <option value="4">Embajador #4</option>
                    </select>

                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={loadingId === t.id}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-all"
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
