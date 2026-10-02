'use client'

import { useState, useEffect } from 'react'
import { buildYouTubeEmbedUrl, extractYouTubeId } from '@/lib/youtube'

interface StreamingPlayerProps {
  youtubeUrl: string
}

export function StreamingPlayer({ youtubeUrl }: StreamingPlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const videoId = extractYouTubeId(youtubeUrl)
  const embedUrl = videoId ? buildYouTubeEmbedUrl(videoId, { autoplay: true, mute: true }) : null

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  if (!embedUrl) {
    return (
      <div className="relative w-full max-w-2xl aspect-video rounded-3xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col items-center justify-center p-6 text-center shadow-2xl backdrop-blur-sm">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-3">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-zinc-200 font-semibold text-base">Transmisión no disponible temporalmente</p>
        <p className="text-zinc-500 text-xs mt-1">El enlace configurado para el streaming no es válido.</p>
      </div>
    )
  }

  return (
    <div
      className={`relative w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto transition-all duration-700 ${
        isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      {/* Glow effect expansivo */}
      <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/30 via-cyan-500/25 to-blue-600/30 rounded-3xl blur-2xl animate-pulse pointer-events-none" />

      {/* Badge "EN VIVO" */}
      <div className="absolute -top-3.5 -left-3.5 z-20 flex items-center gap-2 px-3.5 py-1.5 bg-red-600 rounded-full shadow-xl shadow-red-600/40 border border-red-400/60">
        <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
        <span className="text-[11px] font-black text-white uppercase tracking-widest">
          En Vivo
        </span>
      </div>

      {/* Player container (16:9 aspect-video con bordes pulidos) */}
      <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border-2 border-blue-500/40 shadow-[0_0_50px_rgba(59,130,246,0.3)] bg-black">
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={embedUrl}
            title="Transmisión en vivo - ITEC Saladillo"
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>

      {/* Live indicator bar */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs text-red-400 font-bold uppercase tracking-wider">
          Transmisión en vivo — ITEC Saladillo
        </span>
      </div>
    </div>
  )
}
