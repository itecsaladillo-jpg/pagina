'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video,
  FileText,
  Sparkles,
  ExternalLink,
  Wifi,
  Users,
  CheckCircle2,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { saveNotesAction, finalizeAndPublishAction } from '@/app/dashboard/reuniones/actions'

/* ─────────────────────────────────────────
   Props
───────────────────────────────────────── */
interface MeetingCardProps {
  commissionId: string
  commissionName: string
  initialContent: string
  meetLink: string
  canFinalize: boolean
  memberName: string
}

/* ─────────────────────────────────────────
   Resultado de IA post-finalización
───────────────────────────────────────── */
interface AiResult {
  summary: string
  actionItems: string
}

/* ─────────────────────────────────────────
   MeetingCard
───────────────────────────────────────── */
export function MeetingCard({
  commissionId,
  commissionName,
  initialContent,
  meetLink,
  canFinalize,
  memberName,
}: MeetingCardProps) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [aiResult, setAiResult] = useState<AiResult | null>(null)
  const [onlineCount, setOnlineCount] = useState(1)
  const [isConnected, setIsConnected] = useState(false)
  const [charCount, setCharCount] = useState(initialContent.length)

  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const supabase = createClient()

  /* ── Auto-guardado con debounce 2 s ── */
  const autoSave = useCallback(
    (text: string) => {
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        setIsSaving(true)
        await saveNotesAction(commissionId, text)
        setLastSaved(new Date())
        setIsSaving(false)
      }, 2000)
    },
    [commissionId],
  )

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setContent(val)
    setCharCount(val.length)
    autoSave(val)
  }

  /* ── Realtime: sincronización de notas + presencia ── */
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
            setCharCount((payload.new.content as string).length)
          }
        },
      )
      .on('presence', { event: 'sync' }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commissionId])

  /* ── Finalizar reunión ── */
  const handleFinalize = async () => {
    if (
      !confirm(
        '¿Confirmás el cierre de la reunión? Se generará el resumen y se publicará en el Muro.',
      )
    )
      return

    setIsFinalizing(true)
    const res = await finalizeAndPublishAction(commissionId, content)
    if (res.success && res.summary) {
      setAiResult({ summary: res.summary, actionItems: res.actionItems || '' })
    } else {
      alert('Error: ' + (res.error || 'No se pudo finalizar la reunión.'))
    }
    setIsFinalizing(false)
  }

  /* ══════════════════════════════════════
     VISTA POST-FINALIZACIÓN (resultado IA)
  ══════════════════════════════════════ */
  if (aiResult) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Banner éxito */}
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-emerald-300 text-sm font-semibold">
              Reunión finalizada exitosamente
            </p>
            <p className="text-emerald-400/60 text-xs mt-0.5">
              El resumen fue publicado en el Muro de Noticias
            </p>
          </div>
        </div>

        {/* Resultados IA en dos columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div
            className="glass rounded-2xl p-6 border border-blue-500/10"
            style={{ boxShadow: '0 4px 40px rgba(59,130,246,0.05)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h3 className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                Resumen Ejecutivo
              </h3>
            </div>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-wrap">
              {aiResult.summary}
            </p>
          </div>

          <div
            className="glass rounded-2xl p-6 border border-violet-500/10"
            style={{ boxShadow: '0 4px 40px rgba(139,92,246,0.05)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-violet-400" />
              <h3 className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                Action Items
              </h3>
            </div>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-wrap">
              {aiResult.actionItems}
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  /* ══════════════════════════════════════
     VISTA PRINCIPAL
  ══════════════════════════════════════ */
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-5"
    >
      {/* ─── STATUS BAR ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl">
        {/* Indicador Sala Disponible */}
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
          </span>
          <span className="text-[10px] uppercase tracking-widest text-green-300 font-medium">
            Sala Disponible
          </span>
        </div>

        {/* Estado conexión / presencia / guardado */}
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest">
          <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <Wifi className={`w-3 h-3 ${isConnected ? 'text-green-400' : 'text-yellow-400'}`} />
            {isConnected ? 'En vivo' : 'Conectando...'}
          </span>
          <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <Users className="w-3 h-3" />
            {onlineCount} {onlineCount === 1 ? 'miembro' : 'miembros'}
          </span>
          <AnimatePresence mode="wait">
            {isSaving ? (
              <motion.span
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-amber-400 flex items-center gap-1"
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                Guardando...
              </motion.span>
            ) : lastSaved ? (
              <motion.span
                key="saved"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-emerald-400"
              >
                ✓ Guardado
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── LAYOUT PRINCIPAL ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── TARJETA MEET (glassmorphism) ── */}
        <div className="lg:col-span-2 space-y-4">
          <MeetGlassCard meetLink={meetLink} commissionName={commissionName} />

          {/* Próximas reuniones */}
          <div
            className="glass rounded-2xl p-5 border border-white/[0.05] space-y-3"
            style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.2)' }}
          >
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Próximas Reuniones
            </div>

            {[
              { label: 'Reunión Semanal', time: 'Próximo lunes · 18:00 hs', accent: 'bg-blue-500' },
              { label: 'Revisión de Proyectos', time: 'Próximo miércoles · 19:30 hs', accent: 'bg-violet-500' },
            ].map((ev, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${ev.accent}`} />
                <div>
                  <p className="text-white text-xs font-semibold">{ev.label}</p>
                  <p className="text-[var(--text-muted)] text-[10px]">{ev.time}</p>
                </div>
              </div>
            ))}

            <p className="text-[9px] text-[var(--text-muted)] italic text-center pt-1 opacity-60">
              Conexión con Google Calendar · próximamente
            </p>
          </div>
        </div>

        {/* ── TABLERO DE NOTAS ── */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Header notas */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <FileText className="w-3.5 h-3.5" />
              Tablero de Notas en Vivo
            </div>
            <span className="text-[9px] text-[var(--text-muted)] font-mono">
              {charCount} caracteres
            </span>
          </div>

          {/* Textarea enriquecida */}
          <textarea
            id="meeting-notes-textarea"
            value={content}
            onChange={handleContentChange}
            placeholder={`Registrá los puntos clave de la reunión de ${commissionName}...\n\nEjemplo:\n• Tema 1: Revisión del plan de comunicación\n• Decisión: Publicar el flash informativo el jueves\n• Responsable: Coordinador de comunicaciones\n• Próxima reunión: lunes 18:00`}
            className="flex-1 min-h-[340px] w-full bg-[var(--bg-surface)] border border-white/[0.06] rounded-2xl p-5 text-[var(--text-secondary)] text-sm leading-relaxed focus:outline-none focus:border-[var(--accent-primary)]/30 focus:ring-2 focus:ring-[var(--accent-primary)]/10 transition-all resize-none font-mono placeholder:text-[var(--text-muted)] placeholder:not-italic placeholder:font-sans"
            style={{ boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.3)' }}
          />

          {/* ── BOTÓN GUARDAR Y PROCESAR CON IA ── */}
          {canFinalize && (
            <motion.button
              id="finalize-meeting-btn"
              onClick={handleFinalize}
              disabled={isFinalizing || !content.trim() || content.length < 20}
              whileHover={{ scale: isFinalizing ? 1 : 1.015 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 px-6 rounded-2xl font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group transition-all"
              style={{
                background:
                  'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(59,130,246,0.12) 100%)',
                border: '1px solid rgba(139,92,246,0.3)',
                color: '#c4b5fd',
              }}
            >
              {/* Glow interior en hover */}
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(59,130,246,0.15) 100%)',
                }}
              />

              {isFinalizing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                  <span className="relative z-10">Procesando con Gemini IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform" />
                  <span className="relative z-10">
                    Guardar y Procesar con IA — Publicar Resumen
                  </span>
                </>
              )}
            </motion.button>
          )}

          {/* Nota para miembros sin permiso de finalizar */}
          {!canFinalize && (
            <p className="text-[10px] text-[var(--text-muted)] text-center italic">
              Solo administradores y coordinadores pueden generar el resumen con IA.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────
   Sub-componente: Tarjeta Meet (glassmorphism)
───────────────────────────────────────── */
function MeetGlassCard({
  meetLink,
  commissionName,
}: {
  meetLink: string
  commissionName: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <a
      id="join-meet-btn"
      href={meetLink}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex flex-col items-center justify-center gap-5 p-8 rounded-2xl text-center overflow-hidden transition-all duration-300"
      style={{
        background: hovered
          ? 'linear-gradient(135deg, rgba(6,182,212,0.10) 0%, rgba(59,130,246,0.14) 100%)'
          : 'linear-gradient(135deg, rgba(6,182,212,0.05) 0%, rgba(59,130,246,0.08) 100%)',
        border: hovered
          ? '1px solid rgba(59,130,246,0.45)'
          : '1px solid rgba(59,130,246,0.18)',
        backdropFilter: 'blur(20px)',
        boxShadow: hovered
          ? '0 8px 40px rgba(59,130,246,0.18), inset 0 1px 0 rgba(255,255,255,0.06)'
          : '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* Glow de fondo animado */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: hovered
            ? 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.15) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.05) 0%, transparent 70%)',
          transition: 'background 0.3s ease',
        }}
      />

      {/* Ícono de video */}
      <motion.div
        animate={{ scale: hovered ? 1.12 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(59,130,246,0.25))',
          border: '1px solid rgba(59,130,246,0.3)',
          boxShadow: hovered ? '0 0 30px rgba(59,130,246,0.4)' : '0 0 0px transparent',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        <Video className="w-8 h-8 text-blue-300" />
      </motion.div>

      {/* Título y descripción */}
      <div className="relative z-10 space-y-1.5">
        <p className="text-white font-bold text-lg leading-tight">
          Sala de Reuniones de Comisión
        </p>
        <p className="text-blue-300/70 text-xs leading-relaxed max-w-[200px]">
          La reunión se llevará a cabo en Google Meet · {commissionName}
        </p>
      </div>

      {/* CTA */}
      <div className="relative z-10 flex items-center gap-2 text-sm font-semibold text-blue-300 group-hover:text-white transition-colors">
        <span>Unirse a la Reunión</span>
        <motion.span animate={{ x: hovered ? 4 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
          <ExternalLink className="w-4 h-4" />
        </motion.span>
      </div>

      {/* Línea decorativa inferior */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-300"
        style={{
          background: hovered
            ? 'linear-gradient(90deg, transparent, rgba(59,130,246,0.8), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent)',
        }}
      />
    </a>
  )
}
