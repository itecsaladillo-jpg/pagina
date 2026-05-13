'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  Mic, MicOff, Video, VideoOff, Settings,
  Users, ExternalLink, FileText, Sparkles,
  Loader2, CheckCircle2, Wifi,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { saveNotesAction, finalizeAndPublishAction } from '@/app/dashboard/reuniones/actions'

/* ── Props ── */
interface Props {
  commissionId: string
  commissionName: string
  initialContent: string
  meetLink: string
  canFinalize: boolean
  memberName: string
}

/* ── Stagger variants ── */
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

export function MeetingLobby(props: Props) {
  const { commissionId, commissionName, meetLink, canFinalize, memberName, initialContent } = props

  /* ── Estado lobby ── */
  const [micOn,   setMicOn]   = useState(true)
  const [camOn,   setCamOn]   = useState(true)
  const [inRoom,  setInRoom]  = useState(false) // transición tras pulsar Unirse
  const [onlineCount, setOnlineCount] = useState(1)

  /* ── Estado notas ── */
  const [content,     setContent]     = useState(initialContent)
  const [isSaving,    setIsSaving]    = useState(false)
  const [isFinalizing,setIsFinalizing]= useState(false)
  const [lastSaved,   setLastSaved]   = useState<Date | null>(null)
  const [aiResult,    setAiResult]    = useState<{ summary: string; actionItems: string } | null>(null)
  const [charCount,   setCharCount]   = useState(initialContent.length)
  const [isConnected, setIsConnected] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const supabase  = createClient()

  /* ── Realtime presencia + notas ── */
  useEffect(() => {
    const ch = supabase
      .channel(`lobby-${commissionId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public',
        table: 'meeting_notes', filter: `commission_id=eq.${commissionId}`,
      }, (p) => {
        if (p.new.content !== content) {
          setContent(p.new.content as string)
          setCharCount((p.new.content as string).length)
        }
      })
      .on('presence', { event: 'sync' }, () => {
        setOnlineCount(Object.keys(ch.presenceState()).length)
      })
      .subscribe(async (st) => {
        if (st === 'SUBSCRIBED') {
          setIsConnected(true)
          await ch.track({ member: memberName, online_at: new Date().toISOString() })
        }
      })
    return () => { supabase.removeChannel(ch) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commissionId])

  /* ── Auto-save ── */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setContent(v); setCharCount(v.length)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setIsSaving(true)
      await saveNotesAction(commissionId, v)
      setLastSaved(new Date())
      setIsSaving(false)
    }, 2000)
  }

  /* ── Finalizar ── */
  const handleFinalize = async () => {
    if (!confirm('¿Confirmás el cierre? Se generará el resumen y se publicará en el Muro.')) return
    setIsFinalizing(true)
    const res = await finalizeAndPublishAction(commissionId, content)
    if (res.success && res.summary) {
      setAiResult({ summary: res.summary, actionItems: res.actionItems || '' })
    } else {
      alert('Error: ' + (res.error || 'No se pudo finalizar.'))
    }
    setIsFinalizing(false)
  }

  /* ── Abrir Meet ── */
  const handleJoin = () => {
    setInRoom(true)
    window.open(meetLink, '_blank', 'noopener,noreferrer')
  }

  return (
    <motion.div
      variants={container} initial="hidden" animate="show"
      className="space-y-6"
    >
      {/* ══════════════════════════════════════════
          LOBBY — PANTALLA PARTIDA
      ══════════════════════════════════════════ */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        {/* ── LADO IZQUIERDO: simulación cámara ── */}
        <div className="flex flex-col gap-3">
          {/* Viewport cámara */}
          <div
            className="relative w-full aspect-video rounded-2xl overflow-hidden flex flex-col items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, #0a0f1e 0%, #050810 100%)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: 'inset 0 2px 30px rgba(0,0,0,0.5)',
            }}
          >
            {/* Sutil grid interior */}
            <div className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage: 'linear-gradient(rgba(99,179,237,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,179,237,1) 1px,transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />

            {/* Avatar / ícono cámara */}
            <AnimatePresence mode="wait">
              {camOn ? (
                <motion.div key="cam-on"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center gap-3 z-10"
                >
                  {/* Avatar circular */}
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white"
                    style={{
                      background: 'linear-gradient(135deg,rgba(6,182,212,0.3),rgba(59,130,246,0.4))',
                      border: '2px solid rgba(59,130,246,0.4)',
                      boxShadow: '0 0 40px rgba(59,130,246,0.2)',
                    }}
                  >
                    {memberName.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-white/60 text-sm font-medium">{memberName}</p>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-300 text-[11px] font-medium">Listo para unirte</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="cam-off"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2 z-10"
                >
                  <VideoOff className="w-10 h-10 text-white/20" />
                  <p className="text-white/30 text-xs">Cámara desactivada</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Badge nombre — esquina inferior izquierda */}
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/5">
              <p className="text-white text-[11px] font-medium truncate max-w-[120px]">{memberName}</p>
            </div>

            {/* Indicador REC — esquina superior izquierda */}
            {inRoom && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/90"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-white text-[10px] font-bold uppercase tracking-wider">En reunión</span>
              </motion.div>
            )}
          </div>

          {/* ── BARRA DE HERRAMIENTAS VISUAL ── */}
          <div className="flex items-center justify-center gap-3 py-3 px-4 rounded-2xl"
            style={{
              background: 'rgba(10,15,30,0.8)',
              border: '1px solid rgba(255,255,255,0.05)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Mic */}
            <ToolButton
              icon={micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              label={micOn ? 'Micrófono' : 'Silenciado'}
              active={micOn}
              onClick={() => setMicOn(v => !v)}
              danger={!micOn}
            />
            {/* Cámara */}
            <ToolButton
              icon={camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              label={camOn ? 'Cámara' : 'Cámara off'}
              active={camOn}
              onClick={() => setCamOn(v => !v)}
              danger={!camOn}
            />
            {/* Divisor */}
            <div className="w-px h-8 bg-white/10" />
            {/* Ajustes */}
            <ToolButton
              icon={<Settings className="w-5 h-5" />}
              label="Ajustes"
              active={false}
              onClick={() => {}}
            />
          </div>
        </div>

        {/* ── LADO DERECHO: info y acceso ── */}
        <div className="flex flex-col justify-center gap-6 lg:pl-4">
          {/* Título */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
              Reunión interna · ITEC Saladillo
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
              Reunión de Comisión<br />
              <span className="text-gradient">{commissionName}</span>
            </h2>
            <p className="text-[var(--text-secondary)] text-sm">
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Indicador de personas */}
          <div className="flex items-center gap-3 p-4 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex -space-x-2">
              {[...Array(Math.min(onlineCount, 3))].map((_, i) => (
                <div key={i}
                  className="w-8 h-8 rounded-full border-2 border-[var(--bg-deep)] flex items-center justify-center text-xs font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, hsl(${200 + i * 30},70%,40%), hsl(${220 + i * 30},80%,50%))`,
                    zIndex: 3 - i,
                  }}
                >
                  {i === 0 ? memberName.charAt(0).toUpperCase() : '?'}
                </div>
              ))}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">
                {onlineCount === 1
                  ? 'Sos el primero en llegar'
                  : `Hay ${onlineCount} personas en la sala`}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Wifi className={`w-3 h-3 ${isConnected ? 'text-green-400' : 'text-yellow-400'}`} />
                <span className="text-[10px] text-[var(--text-muted)]">
                  {isConnected ? 'Canal en vivo activo' : 'Conectando...'}
                </span>
              </div>
            </div>
          </div>

          {/* ── BOTÓN UNIRSE (máximo peso visual) ── */}
          <motion.button
            id="join-meet-btn"
            onClick={handleJoin}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="relative w-full py-5 rounded-2xl font-black text-lg text-white overflow-hidden flex items-center justify-center gap-3"
            style={{
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%)',
              boxShadow: '0 8px 40px rgba(22,163,74,0.45), 0 2px 8px rgba(0,0,0,0.4)',
              border: '1px solid rgba(74,222,128,0.3)',
            }}
          >
            {/* Shimmer interior */}
            <span className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.08) 50%,transparent 60%)',
                animation: 'spotlight-ltr 3s ease-in-out infinite',
              }}
            />
            <ExternalLink className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Unirse ahora</span>
          </motion.button>

          {/* Hint de seguridad */}
          <p className="text-[10px] text-[var(--text-muted)] text-center -mt-2">
            Abre Google Meet en una pestaña nueva · <span className="text-green-400/60">noopener noreferrer</span>
          </p>

          {/* Instrucción de doble pestaña */}
          {inRoom && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/15"
            >
              <FileText className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-blue-300/80 text-xs leading-relaxed">
                Tenés Meet abierto en otra pestaña. Podés volver aquí cuando quieras para tomar notas de la sesión.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════
          DIVISOR
      ══════════════════════════════════════════ */}
      <motion.div variants={item} className="section-divider" />

      {/* ══════════════════════════════════════════
          PANEL DE NOTAS Y ACUERDOS
      ══════════════════════════════════════════ */}
      <motion.div variants={item} className="space-y-4">
        {/* Header sección notas */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Panel de Notas y Acuerdos</p>
              <p className="text-[var(--text-muted)] text-[10px]">Se guarda automáticamente · sincronizado en tiempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest">
            <AnimatePresence mode="wait">
              {isSaving ? (
                <motion.span key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1 text-amber-400">
                  <Loader2 className="w-3 h-3 animate-spin" /> Guardando...
                </motion.span>
              ) : lastSaved ? (
                <motion.span key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-emerald-400">✓ Guardado</motion.span>
              ) : null}
            </AnimatePresence>
            <span className="text-[var(--text-muted)] font-mono">{charCount} car.</span>
          </div>
        </div>

        {/* Resultado IA post-finalización */}
        {aiResult ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-emerald-300 text-sm font-semibold">Reunión finalizada · Resumen publicado en el Muro</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Resumen Ejecutivo', content: aiResult.summary, icon: <Sparkles className="w-4 h-4 text-blue-400" />, border: 'border-blue-500/10' },
                { label: 'Action Items', content: aiResult.actionItems, icon: <FileText className="w-4 h-4 text-violet-400" />, border: 'border-violet-500/10' },
              ].map(c => (
                <div key={c.label} className={`glass rounded-2xl p-5 border ${c.border}`}>
                  <div className="flex items-center gap-2 mb-3">{c.icon}
                    <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">{c.label}</span>
                  </div>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-wrap">{c.content}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <>
            {/* Textarea */}
            <textarea
              id="meeting-notes-textarea"
              value={content}
              onChange={handleChange}
              placeholder={`Registrá los puntos clave de la reunión de ${commissionName}...\n\nEjemplo:\n• Tema 1: Revisión del plan de comunicación\n• Decisión: Publicar el flash informativo el jueves\n• Responsable: Coordinador de comunicaciones`}
              className="w-full min-h-[280px] bg-[var(--bg-surface)] border border-white/[0.06] rounded-2xl p-5 text-[var(--text-secondary)] text-sm leading-relaxed focus:outline-none focus:border-[var(--accent-primary)]/30 focus:ring-2 focus:ring-[var(--accent-primary)]/8 transition-all resize-none font-mono placeholder:text-[var(--text-muted)] placeholder:not-italic placeholder:font-sans"
              style={{ boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.3)' }}
            />

            {/* Botón procesar con IA */}
            {canFinalize ? (
              <motion.button
                id="finalize-meeting-btn"
                onClick={handleFinalize}
                disabled={isFinalizing || content.trim().length < 20}
                whileHover={{ scale: isFinalizing ? 1 : 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 px-6 rounded-2xl font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(59,130,246,0.1))',
                  border: '1px solid rgba(139,92,246,0.25)',
                  color: '#c4b5fd',
                }}
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.18),rgba(59,130,246,0.14))' }}
                />
                {isFinalizing
                  ? <><Loader2 className="w-5 h-5 animate-spin relative z-10" /><span className="relative z-10">Procesando con Gemini IA...</span></>
                  : <><Sparkles className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform" /><span className="relative z-10">Guardar y Procesar con IA — Publicar Resumen</span></>
                }
              </motion.button>
            ) : (
              <p className="text-[10px] text-[var(--text-muted)] text-center italic">
                Solo administradores y coordinadores pueden generar el resumen con IA.
              </p>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

/* ── Sub-componente: botón de herramienta ── */
function ToolButton({
  icon, label, active, onClick, danger = false,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  danger?: boolean
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.93 }}
      title={label}
      className="flex flex-col items-center gap-1.5 group"
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200"
        style={{
          background: danger
            ? 'rgba(239,68,68,0.15)'
            : active
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(255,255,255,0.04)',
          border: danger
            ? '1px solid rgba(239,68,68,0.3)'
            : '1px solid rgba(255,255,255,0.08)',
          color: danger ? '#f87171' : active ? '#e2e8f0' : '#64748b',
        }}
      >
        {icon}
      </div>
      <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider group-hover:text-white transition-colors">
        {label}
      </span>
    </motion.button>
  )
}
