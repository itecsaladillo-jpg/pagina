'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createActionAction } from '../actions'
import { Calendar, MapPin, Tag, Type, AlertCircle, ChevronLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function NuevaAccionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'evento_social',
    status: 'en_curso', // En curso por defecto para poder probar el Q&A inmediatamente
    location: 'Auditorio Central ITEC',
    start_date: new Date().toISOString().substring(0, 16), // Formato para datetime-local
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setError('El título es requerido.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        status: formData.status,
        location: formData.location,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : undefined,
      }

      const res = await createActionAction(payload as any)
      if (res.success) {
        // Redirigir directamente al sistema de preguntas para verlo en acción
        router.push('/dashboard/eventos')
        router.refresh()
      } else {
        setError(res.error || 'Ocurrió un error al guardar.')
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in text-slate-100 pb-16">
      {/* Volver */}
      <Link 
        href="/dashboard/eventos" 
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs uppercase font-bold tracking-widest group"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Volver a Preguntas
      </Link>

      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
          <Sparkles className="text-blue-400" size={32} />
          Nueva Acción de Impacto
        </h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Cargá un evento o capacitación técnica para habilitar interacciones en vivo como votaciones, preguntas al expositor y proyección en pantalla gigante.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl backdrop-blur-sm shadow-xl">
        {/* Título */}
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold tracking-wider text-zinc-300 block">Título del Evento / Charla</label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="Ej. Charla sobre IA y Robótica en Saladillo"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full pl-4 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors text-sm"
            />
          </div>
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <label className="text-xs uppercase font-bold tracking-wider text-zinc-300 block">Descripción</label>
          <textarea
            rows={4}
            placeholder="Describí brevemente los temas a tratar o la dinámica del evento..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors text-sm resize-none leading-relaxed"
          />
        </div>

        {/* Grid de 2 Columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tipo de Acción */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold tracking-wider text-zinc-300 block flex items-center gap-2">
              <Type size={14} className="text-blue-400" /> Tipo de Evento
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-colors text-sm"
            >
              <option value="evento_social">Social / Encuentro</option>
              <option value="capacitacion">Capacitación Técnica</option>
              <option value="divulgacion">Divulgación Científica</option>
            </select>
          </div>

          {/* Estado de Acción */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold tracking-wider text-zinc-300 block flex items-center gap-2">
              <Tag size={14} className="text-blue-400" /> Estado Inicial
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-colors text-sm"
            >
              <option value="en_curso">En Curso / Activo (Recomendado para probar)</option>
              <option value="planificacion">En Planificación</option>
              <option value="finalizada">Finalizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {/* Ubicación */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold tracking-wider text-zinc-300 block flex items-center gap-2">
              <MapPin size={14} className="text-blue-400" /> Ubicación / Salón
            </label>
            <input
              type="text"
              placeholder="Ej. Auditorio Central ITEC"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors text-sm"
            />
          </div>

          {/* Fecha de Inicio */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold tracking-wider text-zinc-300 block flex items-center gap-2">
              <Calendar size={14} className="text-blue-400" /> Fecha y Hora
            </label>
            <input
              type="datetime-local"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-colors text-sm"
            />
          </div>
        </div>

        {/* Botón de Enviar */}
        <div className="pt-6 border-t border-zinc-800 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-sm font-bold transition-all shadow-lg active:scale-[0.98]"
          >
            {loading ? 'Guardando Evento...' : 'Crear Evento y Habilitar Q&A'}
          </button>
        </div>
      </form>
    </div>
  )
}
