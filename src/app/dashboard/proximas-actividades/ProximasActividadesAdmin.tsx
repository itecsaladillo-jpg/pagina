'use client'

import { useState, useTransition } from 'react'
import { Calendar, MapPin, Plus, Pencil, Trash2, CheckCircle2, AlertCircle, X, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ProximaActividad } from '@/types/database'
import {
  createActividadAction,
  updateActividadAction,
  deleteActividadAction,
} from './actions'

interface Props {
  initialActividades: ProximaActividad[]
}

export function ProximasActividadesAdmin({ initialActividades }: Props) {
  const [actividades, setActividades] = useState<ProximaActividad[]>(initialActividades)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form State
  const [titulo, setTitulo] = useState('')
  const [lugar, setLugar] = useState('')
  const [fechaDate, setFechaDate] = useState('')
  const [hora, setHora] = useState('19')
  const [minuto, setMinuto] = useState('00')

  // UI State
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Opciones para selectors
  const HORAS_OPCIONES = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const BASE_MINUTOS = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']
  const minutosOpciones = BASE_MINUTOS.includes(minuto)
    ? BASE_MINUTOS
    : Array.from(new Set([...BASE_MINUTOS, minuto])).sort()

  const HORARIOS_PRESET = ['09:00', '10:00', '14:00', '16:00', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30']

  // Helpers de fecha rápida
  const formatDateToYMD = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }

  const setFechaOffset = (daysOffset: number) => {
    const d = new Date()
    d.setDate(d.getDate() + daysOffset)
    setFechaDate(formatDateToYMD(d))
  }

  const resetForm = () => {
    setEditingId(null)
    setTitulo('')
    setLugar('')
    setFechaDate('')
    setHora('19')
    setMinuto('00')
  }

  const handleStartEdit = (actividad: ProximaActividad) => {
    setEditingId(actividad.id)
    setTitulo(actividad.titulo)
    setLugar(actividad.lugar)
    try {
      const d = new Date(actividad.fecha)
      if (!isNaN(d.getTime())) {
        const pad = (n: number) => String(n).padStart(2, '0')
        setFechaDate(formatDateToYMD(d))
        setHora(pad(d.getHours()))
        setMinuto(pad(d.getMinutes()))
      } else {
        setFechaDate('')
        setHora('19')
        setMinuto('00')
      }
    } catch {
      setFechaDate('')
      setHora('19')
      setMinuto('00')
    }
    setMessage(null)

    // Scroll suave hacia el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Vista previa formateada en español
  const getPreviewTexto = () => {
    if (!fechaDate) return null
    try {
      const [y, m, d] = fechaDate.split('-').map(Number)
      if (!y || !m || !d) return null
      const dateObj = new Date(y, m - 1, d, Number(hora || 0), Number(minuto || 0))
      if (isNaN(dateObj.getTime())) return null
      return format(dateObj, "EEEE d 'de' MMMM, yyyy 'a las' HH:mm 'hs'", { locale: es })
    } catch {
      return null
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!titulo.trim()) {
      setMessage({ type: 'error', text: 'Por favor completá el título de la actividad.' })
      return
    }
    if (!lugar.trim()) {
      setMessage({ type: 'error', text: 'Por favor completá el lugar de la actividad.' })
      return
    }
    if (!fechaDate) {
      setMessage({ type: 'error', text: 'Por favor seleccioná la fecha de la actividad.' })
      return
    }

    const [year, month, day] = fechaDate.split('-').map(Number)
    const localDate = new Date(year, month - 1, day, Number(hora || 0), Number(minuto || 0), 0)
    if (isNaN(localDate.getTime())) {
      setMessage({ type: 'error', text: 'La fecha u hora seleccionada no es válida.' })
      return
    }
    const fechaISO = localDate.toISOString()

    startTransition(async () => {
      if (editingId) {
        // Actualizar
        const res = await updateActividadAction(editingId, { titulo, lugar, fecha: fechaISO })
        if (res.success && res.data) {
          setActividades((prev) =>
            prev.map((item) => (item.id === editingId ? res.data! : item))
          )
          setMessage({ type: 'success', text: 'Actividad actualizada exitosamente.' })
          resetForm()
        } else {
          setMessage({ type: 'error', text: res.error || 'Error al actualizar la actividad.' })
        }
      } else {
        // Crear
        const res = await createActividadAction({ titulo, lugar, fecha: fechaISO })
        if (res.success && res.data) {
          setActividades((prev) => [...prev, res.data!].sort(
            (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
          ))
          setMessage({ type: 'success', text: 'Actividad publicada en la pizarra correctamente.' })
          resetForm()
        } else {
          setMessage({ type: 'error', text: res.error || 'Error al crear la actividad.' })
        }
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteActividadAction(id)
      if (res.success) {
        setActividades((prev) => prev.filter((a) => a.id !== id))
        setDeletingId(null)
        if (editingId === id) resetForm()
        setMessage({ type: 'success', text: 'Actividad eliminada de la pizarra.' })
      } else {
        setMessage({ type: 'error', text: res.error || 'Error al eliminar la actividad.' })
      }
    })
  }

  return (
    <div className="space-y-10 max-w-5xl">
      {/* Notificaciones */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 border transition-all ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 size={20} className="flex-shrink-0" />
          ) : (
            <AlertCircle size={20} className="flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="ml-auto text-white/50 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Formulario de Carga / Edición */}
      <div className="bg-[#0b101b] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent-warm)]/10 border border-[var(--accent-warm)]/20 flex items-center justify-center text-[var(--accent-warm)]">
              {editingId ? <Pencil size={20} /> : <Plus size={20} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Editar Próxima Actividad' : 'Nueva Próxima Actividad'}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {editingId
                  ? 'Modificá los campos y guardá los cambios para actualizar la pizarra.'
                  : 'Completá los datos para que aparezca inmediatamente en la pizarra de la página principal.'}
              </p>
            </div>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5 transition-colors"
            >
              <X size={14} /> Cancelar edición
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TÍTULO */}
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="titulo" className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                Título del Evento / Actividad <span className="text-rose-400">*</span>
              </label>
              <input
                id="titulo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="ej. Taller de Nanotecnología y Robótica Aplicada"
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--accent-warm)] focus:ring-1 focus:ring-[var(--accent-warm)] transition-all text-sm"
              />
            </div>

            {/* LUGAR */}
            <div className="space-y-2">
              <label htmlFor="lugar" className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                Lugar <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  id="lugar"
                  type="text"
                  value={lugar}
                  onChange={(e) => setLugar(e.target.value)}
                  placeholder="ej. Auditorio ITEC / Teatro Marconi"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--accent-warm)] focus:ring-1 focus:ring-[var(--accent-warm)] transition-all text-sm"
                />
              </div>
            </div>

            {/* SECCIÓN FECHA Y HORA */}
            <div className="md:col-span-2 bg-black/30 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* FECHA */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="fechaDate" className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Fecha del Evento <span className="text-rose-400">*</span>
                    </label>
                  </div>

                  <div className="relative">
                    <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                    <input
                      id="fechaDate"
                      type="date"
                      value={fechaDate}
                      onChange={(e) => setFechaDate(e.target.value)}
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--accent-warm)] focus:ring-1 focus:ring-[var(--accent-warm)] transition-all text-sm [color-scheme:dark] cursor-pointer"
                    />
                  </div>

                  {/* Atajos rápidos de fecha */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 mr-1">Atajos:</span>
                    <button
                      type="button"
                      onClick={() => setFechaOffset(0)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                    >
                      Hoy
                    </button>
                    <button
                      type="button"
                      onClick={() => setFechaOffset(1)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                    >
                      Mañana
                    </button>
                    <button
                      type="button"
                      onClick={() => setFechaOffset(7)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                    >
                      +7 Días
                    </button>
                    <button
                      type="button"
                      onClick={() => setFechaOffset(15)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                    >
                      +15 Días
                    </button>
                  </div>
                </div>

                {/* HORA */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Horario de Inicio <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {hora}:{minuto} hs
                    </span>
                  </div>

                  {/* Selectores de Hora y Minuto directos (sin problemas de scroll de rueda) */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                      <select
                        value={hora}
                        onChange={(e) => setHora(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-white focus:outline-none focus:border-[var(--accent-warm)] focus:ring-1 focus:ring-[var(--accent-warm)] transition-all text-sm appearance-none cursor-pointer [color-scheme:dark]"
                        title="Seleccionar hora"
                      >
                        {HORAS_OPCIONES.map((h) => (
                          <option key={h} value={h} className="bg-[#0b101b] text-white">
                            {h} hs
                          </option>
                        ))}
                      </select>
                    </div>

                    <span className="text-lg font-bold text-zinc-500">:</span>

                    <div className="flex-1">
                      <select
                        value={minuto}
                        onChange={(e) => setMinuto(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-[var(--accent-warm)] focus:ring-1 focus:ring-[var(--accent-warm)] transition-all text-sm appearance-none cursor-pointer [color-scheme:dark]"
                        title="Seleccionar minutos"
                      >
                        {minutosOpciones.map((m) => (
                          <option key={m} value={m} className="bg-[#0b101b] text-white">
                            {m} min
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Horarios habituales frecuentes */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 mr-1">Comunes:</span>
                    {HORARIOS_PRESET.map((hp) => {
                      const [hPreset, mPreset] = hp.split(':')
                      const isSelected = hora === hPreset && minuto === mPreset
                      return (
                        <button
                          key={hp}
                          type="button"
                          onClick={() => {
                            setHora(hPreset)
                            setMinuto(mPreset)
                          }}
                          className={`text-xs px-2 py-0.5 rounded-lg border transition-all cursor-pointer font-mono ${
                            isSelected
                              ? 'border-[var(--accent-warm)] bg-[var(--accent-warm)]/15 text-[var(--accent-warm)] font-bold shadow-sm'
                              : 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white'
                          }`}
                        >
                          {hp}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Vista previa en vivo */}
              {fechaDate && (
                <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-xs text-amber-300/90 bg-amber-500/5 px-3.5 py-2.5 rounded-xl border border-amber-500/20">
                  <Calendar size={14} className="text-[var(--accent-warm)] flex-shrink-0" />
                  <span>
                    Programado para: <strong className="capitalize text-white">{getPreviewTexto()}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all"
              >
                Descartar
              </button>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-[var(--accent-warm)] to-amber-500 text-black font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 hover:opacity-90 active:scale-95 transition-all text-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : editingId ? (
                <>
                  <CheckCircle2 size={16} />
                  Actualizar Actividad
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Publicar en la Pizarra
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Listado de Próximas Actividades */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
            <Clock size={18} className="text-[var(--accent-warm)]" />
            Actividades Programadas ({actividades.length})
          </h3>
          <span className="text-xs text-zinc-400">
            La pizarra pública muestra las <strong>3 más próximas</strong> (se ocultan pasadas 4 hs)
          </span>
        </div>

        {actividades.length === 0 ? (
          <div className="bg-[#0b101b] border border-white/5 rounded-3xl p-10 text-center space-y-3">
            <Calendar size={40} className="mx-auto text-zinc-600" />
            <p className="text-zinc-300 font-medium">No hay actividades programadas todavía.</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Utilizá el formulario de arriba para cargar títulos, lugares y fechas que se visualizarán en la pizarra principal.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {(() => {
              const nowMs = Date.now()
              const CUATRO_HORAS_MS = 4 * 60 * 60 * 1000
              const vigentesTop3Ids = actividades
                .filter((a) => {
                  const t = new Date(a.fecha).getTime()
                  return !isNaN(t) && nowMs <= t + CUATRO_HORAS_MS
                })
                .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                .slice(0, 3)
                .map((a) => a.id)

              return actividades.map((act) => {
                const actDate = new Date(act.fecha)
                const formattedDate = !isNaN(actDate.getTime())
                  ? format(actDate, "EEEE d 'de' MMMM, yyyy 'a las' HH:mm 'hs'", { locale: es })
                  : act.fecha

                const isEditingThis = editingId === act.id
                const actTime = actDate.getTime()
                const isEnCurso = !isNaN(actTime) && nowMs >= actTime && nowMs <= actTime + CUATRO_HORAS_MS
                const isFinalizada = !isNaN(actTime) && nowMs > actTime + CUATRO_HORAS_MS
                const isVisibleEnPizarra = vigentesTop3Ids.includes(act.id)

                return (
                  <div
                    key={act.id}
                    className={`bg-[#0b101b] border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${
                      isEditingThis
                        ? 'border-[var(--accent-warm)] bg-[var(--accent-warm)]/5 ring-1 ring-[var(--accent-warm)]/30'
                        : isEnCurso
                        ? 'border-emerald-500/40 bg-emerald-500/[0.03]'
                        : 'border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-white tracking-tight truncate">
                          {act.titulo}
                        </h4>

                        {/* Badge de estado en el admin */}
                        {isEnCurso ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            En Curso
                          </span>
                        ) : isVisibleEnPizarra ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[10px] font-bold">
                            Visible en Pizarra
                          </span>
                        ) : isFinalizada ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-medium">
                            Finalizada (+4h)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] font-medium">
                            En Cola
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-zinc-400">
                        <span className="inline-flex items-center gap-1.5 text-amber-300/90 font-medium capitalize">
                          <Calendar size={13} className="text-[var(--accent-warm)] flex-shrink-0" />
                          {formattedDate}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-zinc-300">
                          <MapPin size={13} className="text-indigo-400 flex-shrink-0" />
                          {act.lugar}
                        </span>
                      </div>
                    </div>

                  {/* Acciones: Editar y Eliminar */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(act)}
                      disabled={isPending}
                      className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-xs font-semibold text-zinc-200 transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Editar actividad"
                    >
                      <Pencil size={13} />
                      <span>Editar</span>
                    </button>

                    {deletingId === act.id ? (
                      <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 p-1 rounded-xl">
                        <span className="text-[11px] text-rose-300 font-medium px-1">¿Eliminar?</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(act.id)}
                          disabled={isPending}
                          className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          Sí
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          disabled={isPending}
                          className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingId(act.id)}
                        disabled={isPending}
                        className="px-3 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 hover:border-rose-500/30 text-xs font-semibold text-rose-300 transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Eliminar actividad"
                      >
                        <Trash2 size={13} />
                        <span>Eliminar</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          })()}
          </div>
        )}
      </div>
    </div>
  )
}
