'use client'

import { useState } from 'react'
import { Video, getYouTubeThumbnail } from '@/services/videos'
import { createVideoAction, updateVideoAction, deleteVideoAction, generateVideoSummaryAction } from './actions'
import { Sparkles } from 'lucide-react'

interface VideotecaManagerProps {
  initialVideos: Video[]
}

export default function VideotecaManager({ initialVideos }: VideotecaManagerProps) {
  const [videos, setVideos] = useState<Video[]>(initialVideos)
  const [loading, setLoading] = useState(false)
  const [newVideo, setNewVideo] = useState({ title: '', youtube_url: '' })

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newVideo.title || !newVideo.youtube_url) return

    setLoading(true)
    try {
      const res = await createVideoAction(newVideo)
      if (res.success && res.data) {
        setVideos([res.data, ...videos])
        setNewVideo({ title: '', youtube_url: '' })
      } else {
        throw new Error(res.error)
      }
    } catch (error) {
      console.error('Error al añadir video:', error)
      alert('Error al añadir el video. Verificá la URL.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setLoading(true)
    try {
      const res = await updateVideoAction(id, { is_active: !currentStatus })
      if (res.success && res.data) {
        setVideos(videos.map(v => v.id === id ? res.data! : v))
      } else {
        alert('Error al actualizar el estado: ' + (res.error || 'Desconocido'))
      }
    } catch (error) {
      console.error('Error al actualizar video:', error)
      alert('Error de conexión al actualizar el video.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este video?')) return

    setLoading(true)
    try {
      const res = await deleteVideoAction(id)
      if (res.success) {
        setVideos(videos.filter(v => v.id !== id))
      } else {
        alert('Error al eliminar el video: ' + (res.error || 'Desconocido'))
      }
    } catch (error) {
      console.error('Error al eliminar video:', error)
      alert('Error de conexión al eliminar el video.')
    } finally {
      setLoading(false)
    }
  }
  const handleGenerateSummary = async (id: string, title: string, description: string) => {
    try {
      setLoading(true)
      const res = await generateVideoSummaryAction(id, title, description)
      if (res.success) {
        window.location.reload()
      } else {
        alert('Error al generar resumen: ' + res.error)
      }
    } catch (error) {
      console.error('Error IA:', error)
      alert('Error de conexión con el servicio de IA.')
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Formulario */}
      <div className="lg:col-span-1">
        <form 
          onSubmit={handleAddVideo}
          className="glass border border-[var(--border-subtle)] rounded-2xl p-6 sticky top-24"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Nuevo Video</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Título del Video
              </label>
              <input
                type="text"
                value={newVideo.title}
                onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                placeholder="Ej: Conferencia sobre IA"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                URL de YouTube
              </label>
              <input
                type="url"
                value={newVideo.youtube_url}
                onChange={(e) => setNewVideo({ ...newVideo, youtube_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? 'Procesando...' : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Añadir a Videoteca
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Videos */}
      <div className="lg:col-span-2 space-y-4">
        {/* Resumen de Visibilidad */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl mb-2">
          <div className="flex gap-6 text-sm">
            <span className="text-[var(--text-secondary)]">Total registrados: <b className="text-white ml-1">{videos.length}</b></span>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <span className="text-green-400">Visibles al público: <b className="text-green-300 ml-1">{videos.filter(v => v.is_active).length}</b></span>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <span className="text-red-400">Ocultos: <b className="text-red-300 ml-1">{videos.filter(v => !v.is_active).length}</b></span>
          </div>
        </div>

        {videos.length === 0 ? (
          <div className="glass border border-[var(--border-subtle)] rounded-2xl p-12 text-center">
            <p className="text-[var(--text-muted)]">No hay videos cargados todavía.</p>
          </div>
        ) : (
          videos.map((video) => (
            <div 
              key={video.id}
              className="glass border border-[var(--border-subtle)] rounded-2xl p-4 flex gap-6 items-center group"
            >
              {/* Miniatura */}
              <a 
                href={video.youtube_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="relative w-40 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-black/40 group/thumb hover:ring-2 hover:ring-amber-500/50 transition-all"
              >
                <img 
                  src={getYouTubeThumbnail(video.youtube_url) || video.thumbnail_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=320&auto=format&fit=crop'} 
                  alt={video.title}
                  className="w-full h-full object-cover opacity-80 group-hover/thumb:scale-110 group-hover/thumb:opacity-100 transition-all"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=320&auto=format&fit=crop';
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center border border-white/20 group-hover/thumb:bg-amber-500 group-hover/thumb:border-amber-500 transition-colors shadow-xl">
                     <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.333-5.89a1.5 1.5 0 000-2.538L6.3 2.841z" />
                     </svg>
                   </div>
                </div>
              </a>


              {/* Info */}
              <div className="flex-grow min-w-0">
                <h3 className="text-white font-semibold truncate mb-1">{video.title}</h3>
                <p className="text-[var(--text-muted)] text-[10px] truncate mb-3">
                  {video.youtube_url}
                </p>

                {video.ai_summary && (
                  <div className="mb-4 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Sparkles size={12} className="animate-pulse" /> Resumen de Video
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] line-clamp-3 leading-relaxed italic">
                      "{video.ai_summary}"
                    </p>
                  </div>
                )}

                <button
                  onClick={() => handleGenerateSummary(video.id, video.title, video.description || '')}
                  disabled={loading}
                  className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-lg font-bold uppercase tracking-widest mb-4 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Sparkles size={12} /> {video.ai_summary ? 'Regenerar Resumen IA' : 'Generar Resumen IA'}
                </button>

                
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleToggleActive(video.id, video.is_active)}
                    className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg border transition-colors ${
                      video.is_active 
                        ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}
                  >
                    {video.is_active ? 'Activo' : 'Inactivo'}
                  </button>

                  <button
                    onClick={() => handleDelete(video.id)}
                    className="text-[10px] font-bold uppercase tracking-widest text-red-400/60 hover:text-red-400 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  )
}
