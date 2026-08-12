'use client'

import { useState, useMemo } from 'react'
import { Save, ExternalLink, Loader2 } from 'lucide-react'
import { toggleStreamingAction, updateStreamingUrlAction } from './actions'

interface StreamingControlsProps {
  initialIsActive: boolean
  initialYoutubeUrl: string
}

function extractEmbedUrl(youtubeUrl: string): string | null {
  if (!youtubeUrl) return null

  try {
    const urlObj = new URL(youtubeUrl)
    let videoId: string | null = null

    if (urlObj.searchParams.has('v')) {
      videoId = urlObj.searchParams.get('v')
    } else if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1)
    } else if (urlObj.pathname.includes('/embed/')) {
      videoId = urlObj.pathname.split('/embed/')[1]?.split('?')[0]
    } else if (urlObj.pathname.includes('/live/')) {
      videoId = urlObj.pathname.split('/live/')[1]?.split('?')[0]
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  } catch {
    return null
  }
}

export function StreamingControls({ initialIsActive, initialYoutubeUrl }: StreamingControlsProps) {
  const [isActive, setIsActive] = useState(initialIsActive)
  const [youtubeUrl, setYoutubeUrl] = useState(initialYoutubeUrl)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const previewUrl = useMemo(() => extractEmbedUrl(youtubeUrl), [youtubeUrl])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      const urlResult = await updateStreamingUrlAction(youtubeUrl)
      if (!urlResult.success) {
        setSaveMessage({ type: 'error', text: urlResult.error || 'Error al guardar URL' })
        return
      }

      const toggleResult = await toggleStreamingAction(isActive)
      if (!toggleResult.success) {
        setSaveMessage({ type: 'error', text: toggleResult.error || 'Error al cambiar estado' })
        return
      }

      setSaveMessage({ type: 'success', text: 'Cambios guardados correctamente' })
    } catch {
      setSaveMessage({ type: 'error', text: 'Error inesperado al guardar' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-900/20 to-zinc-900/40 border border-blue-500/20 p-6 rounded-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Transmisión Abierta (YouTube)</h3>
            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Streaming en Landing Page</p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={() => setIsActive(!isActive)}
          className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
            isActive ? 'bg-blue-600' : 'bg-zinc-700'
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 shadow-lg ${
              isActive ? 'translate-x-9' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Status Badge */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest self-start ${
        isActive 
          ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
          : 'bg-zinc-500/10 border border-zinc-500/20 text-zinc-400'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`} />
        {isActive ? 'Transmisión Activa' : 'Transmisión Inactiva'}
      </div>

      {/* URL Input */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          URL de YouTube
        </label>
        <input
          type="url"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
        />
        <p className="text-[10px] text-zinc-500">
          Soporta: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/live/ID
        </p>
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Vista Previa
          </label>
          <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-black">
            <iframe
              src={previewUrl}
              title="Preview"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-blue-600/15"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save size={16} />
              Guardar Cambios
            </>
          )}
        </button>

        {saveMessage && (
          <span className={`text-xs font-medium ${
            saveMessage.type === 'success' ? 'text-green-400' : 'text-red-400'
          }`}>
            {saveMessage.text}
          </span>
        )}
      </div>

      {/* Quick Link */}
      {isActive && youtubeUrl && (
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ExternalLink size={14} />
          Abrir transmisión en YouTube
        </a>
      )}
    </div>
  )
}
