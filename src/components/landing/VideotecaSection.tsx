'use client'

import { useState, useEffect } from 'react'
import { Video, videoService, getYouTubeID } from '@/services/videos'

export function VideotecaSection() {
  const [videos, setVideos] = useState<Video[]>([])
  const [activeVideo, setActiveVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

  if (loading) return null
  if (videos.length === 0) return null

  const activeVideoId = activeVideo ? getYouTubeID(activeVideo.youtube_url) : null

  return (
    <section id="videoteca" className="py-24 relative overflow-hidden bg-[#050505]">
      {/* Fondo decorativo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/20 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            VIDEOTECA <span className="text-amber-500">ITEC</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl">
            Explorá nuestra galería de contenidos, charlas y eventos. Tecnología y comunidad en movimiento.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Reproductor Principal */}
          <div className="lg:col-span-8">
            <div className="relative aspect-video rounded-3xl overflow-hidden glass border border-white/10 shadow-2xl">
              {activeVideoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`}
                  title={activeVideo?.title}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                   <p className="text-white/40">Seleccioná un video para comenzar</p>
                </div>
              )}
            </div>
            <div className="mt-6">
              <h3 className="text-2xl font-bold text-white mb-2">{activeVideo?.title}</h3>
              <p className="text-[var(--text-secondary)]">{activeVideo?.description}</p>
            </div>
          </div>

          {/* Galería Lateral / Lista */}
          <div className="lg:col-span-4 h-fit max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex flex-col gap-4">
              {videos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => setActiveVideo(video)}
                  className={`flex gap-4 p-3 rounded-2xl transition-all border text-left group ${
                    activeVideo?.id === video.id
                      ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <div className="relative w-32 aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-black/40">
                    <img
                      src={video.thumbnail_url || ''}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
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

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </section>
  )
}
