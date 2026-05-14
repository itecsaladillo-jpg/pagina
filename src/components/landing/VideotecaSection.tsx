'use client'

import { useState, useEffect } from 'react'
import { Video, videoService, getYouTubeID, getYouTubeThumbnail } from '@/services/videos'
import { Sparkles } from 'lucide-react'

export function VideotecaSection() {
  const [videos, setVideos] = useState<Video[]>([])
  const [activeVideo, setActiveVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasInteracted, setHasInteracted] = useState(false)


  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const loadVideos = async () => {
      try {
        const data = await videoService.getPublicVideos()
        setVideos(data)
        if (data.length > 0) {
          setActiveVideo(data[0])
        }

      } catch (error) {
        console.error('Error loading videos:', error)
      } finally {
        setLoading(false)
      }
    }
    loadVideos()
  }, [])

  if (!mounted || loading || videos.length === 0) return null

  const activeVideoId = activeVideo ? getYouTubeID(activeVideo.youtube_url) : null

  const handleSelectVideo = (video: Video) => {
    setActiveVideo(video)
    setHasInteracted(true)
  }


  return (
    <section id="videoteca" className="pt-[76px] pb-24 relative overflow-hidden bg-[#050505]">


      {/* Fondo decorativo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/20 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Reproductor Principal (Izquierda) */}
          <div className="lg:col-span-7 pt-[10px]">

            <div className="relative aspect-video rounded-3xl overflow-hidden glass border border-white/10 shadow-2xl bg-black">
              {activeVideoId ? (
                <iframe
                  key={activeVideoId}
                  src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=${hasInteracted ? 1 : 0}&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0&controls=1&disablekb=0&color=white`}
                  title={activeVideo?.title || 'Reproductor de video'}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : activeVideo ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h4 className="text-white font-bold mb-2">Video no disponible</h4>
                  <p className="text-[var(--text-secondary)] text-sm max-w-xs">
                    No pudimos procesar el enlace: <br/>
                    <code className="text-amber-500/80 break-all text-[10px]">{activeVideo.youtube_url}</code>
                  </p>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                   <p className="text-white/40">Seleccioná un video para comenzar</p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-2xl font-bold text-white mb-2">{activeVideo?.title}</h3>
              
              {activeVideo?.ai_summary && (
                <div className="mb-6 bg-amber-500/5 border-l-2 border-amber-500 p-5 rounded-r-2xl animate-fade-in">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-amber-500 animate-pulse" />
                    <span className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em]">
                      Resumen del encuentro
                    </span>
                  </div>
                  <p className="text-white/90 text-base leading-relaxed italic font-medium">
                    "{activeVideo.ai_summary}"
                  </p>
                </div>
              )}

              <p className="text-[var(--text-secondary)] text-sm md:text-base leading-relaxed">
                {activeVideo?.description}
              </p>
            </div>

          </div>

          {/* Lateral Derecha: Título + Galería */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="mb-8 text-right">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tighter mb-3">
                Videoteca <span className="text-gradient">ITEC</span>
              </h2>
              <p className="text-[var(--text-secondary)] text-base md:text-lg leading-relaxed">
                Contenidos, charlas, notas y eventos.
              </p>
            </div>

            <div className="h-fit max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">

              <div className="flex flex-col gap-4">
                {videos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => handleSelectVideo(video)}
                    className={`flex gap-4 p-3 rounded-2xl transition-all border text-left group glass ${
                      activeVideo?.id === video.id
                        ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20'
                        : 'bg-white/[0.01] border-white/5 hover:border-blue-500/30 hover:bg-white/5'
                    }`}
                  >

                    <div className="relative w-32 aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-black/60 border border-white/5">
                      <img
                        src={getYouTubeThumbnail(video.youtube_url) || video.thumbnail_url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=320&auto=format&fit=crop'}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=320&auto=format&fit=crop';
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                         <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.333-5.89a1.5 1.5 0 000-2.538L6.3 2.841z" />
                         </svg>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <h4 className={`font-semibold text-sm line-clamp-2 leading-tight transition-colors ${
                        activeVideo?.id === video.id ? 'text-amber-500' : 'text-white'
                      }`}>
                        {video.title}
                      </h4>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
