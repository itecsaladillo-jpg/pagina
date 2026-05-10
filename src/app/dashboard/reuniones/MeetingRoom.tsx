'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { saveNotesAction, finalizeAndPublishAction } from './actions'

interface Props {
  commissionId: string
  commissionName: string
  initialContent: string
  meetLink: string
  canFinalize: boolean
  memberName: string
}

export function MeetingRoom({
  commissionId,
  commissionName,
  initialContent,
  meetLink,
  canFinalize,
  memberName,
}: Props) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [result, setResult] = useState<{ summary: string; actionItems: string } | null>(null)
  const [onlineCount, setOnlineCount] = useState(1)
  const [isConnected, setIsConnected] = useState(false)
  const saveTimer = useRef<NodeJS.Timeout>()
  const supabase = createClient()

  // Auto-guardado con debounce de 2 segundos
  const autoSave = useCallback((text: string) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setIsSaving(true)
      await saveNotesAction(commissionId, text)
      setLastSaved(new Date())
      setIsSaving(false)
    }, 2000)
  }, [commissionId])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    autoSave(newContent)
  }

  // Suscripción Realtime para sincronización de notas
  useEffect(() => {
    const channel = supabase
      .channel(`meeting-${commissionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'meeting_notes',
          filter: `commission_id=eq.${commissionId}`,
        },
        (payload) => {
          if (payload.new.content !== content) {
            setContent(payload.new.content)
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setOnlineCount(Object.keys(state).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          await channel.track({ member: memberName, online_at: new Date().toISOString() })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [commissionId])

  const handleFinalize = async () => {
    if (!confirm('¿Confirmás el cierre de la reunión? Se generará el resumen y se publicará en el Muro.')) return
    setIsFinalizing(true)
    const res = await finalizeAndPublishAction(commissionId, content)
    if (res.success && res.summary) {
      setResult({ summary: res.summary, actionItems: res.actionItems || '' })
    } else {
      alert('Error: ' + (res.error || 'No se pudo finalizar la reunión.'))
    }
    setIsFinalizing(false)
  }

  // Si ya se finalizó, mostrar el resultado
  if (result) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-green-300 text-sm font-medium">Reunión finalizada · Resumen publicado en el Muro</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass border border-white/5 rounded-2xl p-6">
            <h3 className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-4">Resumen Ejecutivo</h3>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-wrap">{result.summary}</p>
          </div>
          <div className="glass border border-white/5 rounded-2xl p-6">
            <h3 className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-4">Action Items</h3>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-wrap">{result.actionItems}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl text-[10px] uppercase tracking-widest">
        <div className="flex items-center gap-3">
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
          <span className="text-[var(--text-muted)]">{isConnected ? 'Canal en vivo activo' : 'Conectando...'}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[var(--text-muted)]">{onlineCount} {onlineCount === 1 ? 'miembro' : 'miembros'} en sala</span>
          {isSaving ? (
            <span className="text-amber-400">Guardando...</span>
          ) : lastSaved ? (
            <span className="text-green-400">Guardado ✓</span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ─── MEET BUTTON ─── */}
        <div className="lg:col-span-2 space-y-4">
          <a
            href={meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/40 transition-all text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-lg">Unirse a la Reunión</p>
              <p className="text-blue-300/70 text-xs mt-1">Google Meet — {commissionName}</p>
            </div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-medium">
              <span>Abrir sala</span>
              <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </a>

          {/* Widget de Próximas Reuniones */}
          <div className="glass border border-white/5 rounded-2xl p-5 space-y-4">
            <h3 className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Próximas Reuniones
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Reunión Semanal', time: 'Próximo lunes · 18:00 hs', type: 'regular' },
                { label: 'Revisión de Proyectos', time: 'Próximo miércoles · 19:30 hs', type: 'especial' },
              ].map((event, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                  <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${event.type === 'regular' ? 'bg-blue-500' : 'bg-violet-500'}`} />
                  <div>
                    <p className="text-white text-xs font-semibold">{event.label}</p>
                    <p className="text-[var(--text-muted)] text-[10px]">{event.time}</p>
                  </div>
                </div>
              ))}
              <p className="text-[9px] text-[var(--text-muted)] italic text-center pt-1">
                Conexión con Google Calendar — próximamente
              </p>
            </div>
          </div>
        </div>

        {/* ─── TABLERO DE NOTAS ─── */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Tablero de Notas en Vivo
            </h3>
            <span className="text-[9px] text-[var(--text-muted)]">{content.length} caracteres</span>
          </div>

          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder={`Registrá los puntos clave de la reunión de ${commissionName}...\n\nEjemplo:\n• Tema 1: Revisión del plan de comunicación\n• Decisión: Publicar el flash informativo el jueves\n• Responsable: Coordinador de comunicaciones`}
            className="flex-1 min-h-[380px] w-full bg-[var(--bg-surface)] border border-white/5 rounded-2xl p-6 text-[var(--text-secondary)] text-sm leading-relaxed focus:outline-none focus:border-[var(--accent-primary)]/40 transition-colors resize-none font-mono placeholder:text-[var(--text-muted)] placeholder:not-italic placeholder:font-sans"
          />

          {/* Botón Finalizar */}
          {canFinalize && (
            <button
              onClick={handleFinalize}
              disabled={isFinalizing || !content.trim()}
              className="w-full py-4 px-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all text-emerald-300 font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
            >
              {isFinalizing ? (
                <>
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  Procesando con IA...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Finalizar y Resumir con IA — Publicar en el Muro
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
