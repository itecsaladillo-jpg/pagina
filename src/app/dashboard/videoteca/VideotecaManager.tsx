'use client'

import { useState } from 'react'
import { Video, videoService, getYouTubeThumbnail } from '@/services/videos'

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
      const video = await videoService.createVideo(newVideo)
      setVideos([video, ...videos])
      setNewVideo({ title: '', youtube_url: '' })
    } catch (error) {
      console.error('Error al añadir video:', error)
      alert('Error al añadir el video. Verificá la URL.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const updated = await videoService.updateVideo(id, { is_active: !currentStatus })
      setVideos(videos.map(v => v.id === id ? updated : v))
    } catch (error) {
      console.error('Error al actualizar video:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este video?')) return

    try {
      await videoService.deleteVideo(id)
      setVideos(videos.filter(v => v.id !== id))
    } catch (error) {
      console.error('Error al eliminar video:', error)
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
              <div className="relative w-40 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-black/40">
                <img 
                  src={video.thumbnail_url || getYouTubeThumbnail(video.youtube_url)} 
                  alt={video.title}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center border border-white/20">
                     <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.333-5.89a1.5 1.5 0 000-2.538L6.3 2.841z" />
                     </svg>
                   </div>
                </div>
              </div>

              {/* Info */}
              <div className="flex-grow min-w-0">
                <h3 className="text-white font-semibold truncate mb-1">{video.title}</h3>
                <p className="text-[var(--text-muted)] text-xs truncate mb-3">
                  {video.youtube_url}
                </p>
                
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleToggleActive(video.id, video.is_active)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      video.is_active 
                        ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}
                  >
                    {video.is_active ? 'Activo' : 'Inactivo'}
                  </button>

                  <button
                    onClick={() => handleDelete(video.id)}
                    className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
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
