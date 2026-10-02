'use client'

import { useState, useMemo } from 'react'
import { Save, ExternalLink, Loader2, CheckCircle2, AlertTriangle, Video, Radio, Sparkles } from 'lucide-react'
import { saveStreamingConfigAction } from './actions'
import { extractYouTubeId, buildYouTubeEmbedUrl } from '@/lib/youtube'

interface StreamingControlsProps {
  initialIsActive: boolean
  initialYoutubeUrl: string
}

export function StreamingControls({ initialIsActive, initialYoutubeUrl }: StreamingControlsProps) {
  const [streamingEnabled, setStreamingEnabled] = useState(initialIsActive)
  const [youtubeUrl, setYoutubeUrl] = useState(initialYoutubeUrl)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Parsing y extracción del ID en tiempo real
  const detectedVideoId = useMemo(() => extractYouTubeId(youtubeUrl), [youtubeUrl])

  // URL para iframe de vista previa con parámetros anti-branding
  const previewEmbedUrl = useMemo(() => {
    return detectedVideoId ? buildYouTubeEmbedUrl(detectedVideoId, { autoplay: false, mute: false }) : null
  }, [detectedVideoId])

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSaving(true)
    setFeedback(null)

    // Si está habilitado pero no hay URL
    if (streamingEnabled && !youtubeUrl.trim()) {
      setIsSaving(false)
      setFeedback({
        type: 'error',
        message: 'Debes ingresar una URL de YouTube para poder activar la transmisión en vivo.',
      })
      return
    }

    // Si hay URL pero no es válida
    if (youtubeUrl.trim() && !detectedVideoId) {
      setIsSaving(false)
      setFeedback({
        type: 'error',
        message: 'El formato de enlace de YouTube no es válido. Verifica la URL ingresada.',
      })
      return
    }

    try {
      const result = await saveStreamingConfigAction({
        streaming_enabled: streamingEnabled,
        youtube_url: youtubeUrl.trim(),
      })

      if (result.success) {
        setFeedback({
          type: 'success',
          message: streamingEnabled
            ? '¡Transmisión activada y visible en el Home exitosamente!'
            : 'Configuración guardada. La transmisión está desactivada.',
        })
      } else {
        setFeedback({
          type: 'error',
          message: result.error || 'Ocurrió un error al intentar guardar los cambios.',
        })
      }
    } catch (err) {
      console.error(err)
      setFeedback({
        type: 'error',
        message: 'Error inesperado de comunicación con el servidor.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-950/30 via-zinc-900/60 to-zinc-950/80 border border-blue-500/20 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Glow ambiental */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Encabezado e Interruptor ON/OFF */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
            <Radio className={`w-6 h-6 ${streamingEnabled ? 'text-red-500 animate-pulse' : 'text-blue-400'}`} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Transmisión en Vivo (Home)
              {streamingEnabled && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/20 border border-red-500/30 text-red-400 animate-pulse">
                  Al Aire
                </span>
              )}
            </h3>
            <p className="text-zinc-400 text-xs mt-0.5">
              Controla el reproductor incrustado de la columna derecha de la página principal.
            </p>
          </div>
        </div>

        {/* Interruptor (Switch) con accesibilidad */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <span className="text-xs font-semibold text-zinc-400">
            {streamingEnabled ? 'Activado' : 'Desactivado'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={streamingEnabled}
            onClick={() => setStreamingEnabled(!streamingEnabled)}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-950 cursor-pointer ${
              streamingEnabled
                ? 'bg-gradient-to-r from-red-600 to-rose-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                : 'bg-zinc-800 border border-zinc-700/60'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-all duration-300 shadow-md ${
                streamingEnabled ? 'translate-x-9 shadow-red-950' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Formulario y Campo de URL */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="youtube_url" className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-400" />
              URL de Transmisión o Video de YouTube
            </label>
            {detectedVideoId && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 size={12} />
                ID: {detectedVideoId}
              </span>
            )}
          </div>

          <div className="relative">
            <input
              id="youtube_url"
              type="text"
              value={youtubeUrl}
              onChange={(e) => {
                setYoutubeUrl(e.target.value)
                if (feedback) setFeedback(null)
              }}
              placeholder="Ej: https://www.youtube.com/watch?v=... o https://youtu.be/... o https://www.youtube.com/live/..."
              className="w-full px-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all shadow-inner"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-500 gap-2 pt-1">
            <p>
              Soporta enlaces normales (<code className="text-zinc-400">/watch?v=ID</code>), cortos (<code className="text-zinc-400">youtu.be/ID</code>) y en vivo (<code className="text-zinc-400">/live/ID</code>).
            </p>
            {youtubeUrl.trim() && !detectedVideoId && (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle size={12} />
                Enlace no reconocido
              </span>
            )}
          </div>
        </div>

        {/* Vista previa en tiempo real */}
        {previewEmbedUrl && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-cyan-400" />
                Vista Previa del Reproductor
              </span>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                Abrir en YouTube
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-zinc-800 bg-black shadow-2xl">
              <iframe
                src={previewEmbedUrl}
                title="Vista previa de YouTube"
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <p className="text-[10px] text-zinc-500 text-center">
              Parámetros anti-branding aplicados: modestbranding, rel=0, iv_load_policy=3.
            </p>
          </div>
        )}

        {/* Notificaciones y Mensajes de confirmación */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-start gap-3 transition-all animate-fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="leading-relaxed font-medium">{feedback.message}</div>
          </div>
        )}

        {/* Botón de Guardado */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-200 active:scale-[0.98] shadow-lg shadow-blue-600/25 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Guardando configuración...
              </>
            ) : (
              <>
                <Save size={16} />
                Guardar y Aplicar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
