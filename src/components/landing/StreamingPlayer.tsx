'use client'

import { useState, useEffect } from 'react'

interface StreamingPlayerProps {
  youtubeUrl: string
}

/**
 * Convierte cualquier URL de YouTube a formato embed.
 * Soporta: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
 */
function convertToEmbedUrl(url: string): string | null {
  if (!url) return null

  try {
    const urlObj = new URL(url)

    // youtube.com/watch?v=ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) {
      const videoId = urlObj.searchParams.get('v')
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`
    }

    // youtu.be/ID
    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1)
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`
    }

    // youtube.com/embed/ID (ya es embed)
    if (urlObj.pathname.includes('/embed/')) {
      return `${url}?autoplay=1&mute=1`
    }

    // youtube.com/live/ID
    if (urlObj.pathname.includes('/live/')) {
      const videoId = urlObj.pathname.split('/live/')[1]?.split('?')[0]
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`
      }
    }

    return null
  } catch {
    return null
  }
}

export function StreamingPlayer({ youtubeUrl }: StreamingPlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const embedUrl = convertToEmbedUrl(youtubeUrl)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  if (!embedUrl) {
    return (
      <div className="relative w-full max-w-[640px] aspect-video rounded-2xl bg-zinc-900 border border-red-500/30 flex items-center justify-center">
        <p className="text-zinc-400 text-sm">URL de YouTube no válida</p>
      </div>
    )
  }

  return (
    <div
      className={`relative w-full max-w-[640px] transition-all duration-700 ${
        isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-blue-600/20 rounded-2xl blur-xl animate-pulse pointer-events-none" />

      {/* Badge "EN VIVO" */}
      <div className="absolute -top-3 -left-3 z-20 flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-full shadow-lg shadow-red-600/30 border border-red-400/50">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span className="text-[10px] font-black text-white uppercase tracking-widest">
          En Vivo
        </span>
      </div>

      {/* Player container */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={embedUrl}
            title="Transmisión en vivo - ITEC"
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>

      {/* Live indicator bar */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
          Transmisión en vivo — ITEC Saladillo
        </span>
      </div>
    </div>
  )
}
