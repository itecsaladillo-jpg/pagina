'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Archive, 
  PlusCircle, 
  ExternalLink, 
  Calendar, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Sparkles,
  Link as LinkIcon,
  Tag
} from 'lucide-react'
import { createArchivoAccionAction, deleteArchivoAccionAction } from './actions'
import type { ArchivoAccion, ArchivoYear } from '@/types/database'

interface ArchivoClientProps {
  initialAcciones: ArchivoAccion[]
}

const YEARS: ArchivoYear[] = [2025, 2024, 2023, 2022]

export function ArchivoClient({ initialAcciones }: ArchivoClientProps) {
  const [acciones, setAcciones] = useState<ArchivoAccion[]>(initialAcciones)
  const [selectedFilterYear, setSelectedFilterYear] = useState<number | 'todos'>('todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  // Estado del formulario
  const [title, setTitle] = useState('')
  const [socialUrl, setSocialUrl] = useState('')
  const [year, setYear] = useState<string>('') // Vacío por defecto para obligar a seleccionar
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  
  // Feedback
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    // Validaciones en cliente
    if (!title.trim()) {
      setFormError('El título del evento es obligatorio.')
      return
    }
    if (!socialUrl.trim()) {
      setFormError('El link a la publicación de redes sociales es obligatorio.')
      return
    }
    if (!year) {
      setFormError('Para cada artículo es obligación elegir un año (2022, 2023, 2024 o 2025).')
      return
    }

    startTransition(async () => {
      const res = await createArchivoAccionAction({
        title: title.trim(),
        social_url: socialUrl.trim(),
        year: Number(year),
        category: category.trim() || 'General',
        description: description.trim() || undefined
      })

      if (res.success && res.data) {
        setAcciones(prev => [res.data, ...prev])
        setTitle('')
        setSocialUrl('')
        setYear('')
        setCategory('')
        setDescription('')
        setFormSuccess('¡Evento guardado con éxito en el Archivo!')
        setTimeout(() => setFormSuccess(null), 4000)
      } else {
        setFormError(res.error || 'Ocurrió un error al guardar el evento.')
      }
    })
  }

  const handleDelete = (id: string, eventTitle: string) => {
    if (!confirm(`¿Estás seguro de que deseás eliminar del archivo el evento:\n"${eventTitle}"?`)) {
      return
    }

    setDeletingId(id)
    startTransition(async () => {
      const res = await deleteArchivoAccionAction(id)
      if (res.success) {
        setAcciones(prev => prev.filter(a => a.id !== id))
      } else {
        alert(res.error || 'No se pudo eliminar el evento.')
      }
      setDeletingId(null)
    })
  }

  // Filtrado de la lista
  const filteredAcciones = acciones.filter(item => {
    const matchesYear = selectedFilterYear === 'todos' || item.year === selectedFilterYear
    const matchesSearch = 
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesYear && matchesSearch
  })

  return (
    <div className="space-y-10">
      {/* ── Formulario de Carga ── */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-black/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 blur-[100px] pointer-events-none rounded-full" />
        
        <div className="flex items-center gap-3 pb-6 border-b border-white/10 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <PlusCircle size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Cargar Evento o Acción Histórica
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Los eventos cargados se mostrarán en la sección "ITEC EN MOVIMIENTO" de la landing page.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 relative z-10">
          {/* Mensajes de Alerta */}
          {formError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-3">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-3">
              <CheckCircle2 size={18} className="flex-shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Título */}
            <div className="md:col-span-2 space-y-1.5">
              <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Título del Evento / Acción <span className="text-pink-400">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej: Masterclass de Inteligencia Artificial aplicada a la educación"
                required
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-all"
              />
            </div>

            {/* Desplegable de Años: Obligatorio */}
            <div className="space-y-1.5">
              <label htmlFor="year" className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Año del Evento <span className="text-pink-400">*</span></span>
                <span className="text-[10px] text-amber-400 font-semibold lowercase">(obligatorio)</span>
              </label>
              <select
                id="year"
                value={year}
                onChange={e => setYear(e.target.value)}
                required
                className={`w-full px-4 py-3 rounded-xl bg-black/60 border text-sm font-semibold focus:outline-none transition-all cursor-pointer ${
                  year 
                    ? 'border-cyan-500/50 text-cyan-300 ring-1 ring-cyan-500/20' 
                    : 'border-white/10 text-slate-400 focus:border-blue-500'
                }`}
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">
                  -- Seleccionar año (2022 - 2025) --
                </option>
                <option value="2025" className="bg-slate-900 text-white">2025</option>
                <option value="2024" className="bg-slate-900 text-white">2024</option>
                <option value="2023" className="bg-slate-900 text-white">2023</option>
                <option value="2022" className="bg-slate-900 text-white">2022</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Link a redes sociales */}
            <div className="space-y-1.5">
              <label htmlFor="socialUrl" className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <LinkIcon size={12} className="text-pink-400" />
                <span>Link a la publicación en Redes Sociales <span className="text-pink-400">*</span></span>
              </label>
              <input
                id="socialUrl"
                type="url"
                value={socialUrl}
                onChange={e => setSocialUrl(e.target.value)}
                placeholder="https://www.instagram.com/p/..."
                required
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-sm transition-all"
              />
            </div>

            {/* Categoría */}
            <div className="space-y-1.5">
              <label htmlFor="category" className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Tag size={12} className="text-cyan-400" />
                <span>Categoría o Eje Temático (Opcional)</span>
              </label>
              <input
                id="category"
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="Ej: Exposición, Capacitación, Agrotech, Divulgación"
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-all"
              />
            </div>
          </div>

          {/* Descripción opcional */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Descripción o Síntesis de la Actividad (Opcional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Breve reseña del impacto o contenido de la jornada..."
              className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-all resize-none"
            />
          </div>

          {/* Botón de Guardado */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className={`
                px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-300
                flex items-center gap-2 shadow-lg cursor-pointer
                ${isPending 
                  ? 'bg-blue-600/50 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 hover:shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98]'
                }
              `}
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Archive size={16} />
                  <span>Guardar en Archivo Histórico</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Explorador y Gestión de Eventos del Archivo ── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Archive size={22} className="text-cyan-400" />
              <span>Eventos Registrados en el Archivo</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-semibold">
                {acciones.length} en total
              </span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Filtrá por año o buscá por palabras clave para verificar y gestionar los títulos y sus links.
            </p>
          </div>

          {/* Buscador */}
          <div className="relative min-w-[260px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por título o tema..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Pestañas de Años */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white/[0.02] border border-white/5">
          <button
            type="button"
            onClick={() => setSelectedFilterYear('todos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilterYear === 'todos'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Todos ({acciones.length})
          </button>
          {YEARS.map(y => {
            const count = acciones.filter(a => a.year === y).length
            return (
              <button
                key={y}
                type="button"
                onClick={() => setSelectedFilterYear(y)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedFilterYear === y
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{y}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 text-slate-200">
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Listado de Tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredAcciones.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-blue-500/30 transition-all flex flex-col justify-between group relative"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/20 text-cyan-300 font-black text-xs border border-blue-500/30">
                        {item.year}
                      </span>
                      {item.category && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded bg-white/5">
                          {item.category}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.title)}
                      disabled={deletingId === item.id}
                      className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Eliminar este evento del archivo"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <h4 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors leading-snug">
                    {item.title}
                  </h4>

                  {item.description && (
                    <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <a
                    href={item.social_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold group/link"
                  >
                    <span>Ver publicación en redes</span>
                    <ExternalLink size={13} className="group-hover/link:translate-x-0.5 transition-transform" />
                  </a>

                  <span className="text-[10px] text-slate-500">
                    {new Date(item.created_at).toLocaleDateString('es-AR')}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredAcciones.length === 0 && (
          <div className="text-center py-16 rounded-3xl border border-white/5 bg-white/[0.01]">
            <Archive size={36} className="mx-auto text-slate-600 mb-3" />
            <p className="text-base font-bold text-slate-300">
              No se encontraron eventos en este año o con ese criterio de búsqueda.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Podés registrar uno nuevo completando el formulario superior.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
