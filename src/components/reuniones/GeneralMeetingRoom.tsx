'use client'

import { useState, useRef } from 'react'
import {
  Video, VideoOff, ListChecks, History, Sparkles,
  Users, FileText, Loader2, Clock, ExternalLink,
  Copy, Hand, MessageSquare, Vote, Circle
} from 'lucide-react'
import { saveNotesAction, finalizeAndPublishAction } from '@/app/dashboard/reuniones/actions'


interface Member {
  full_name: string
  email: string
  role: string
}

interface MeetingHistory {
  id: string
  content: string
  session_date: string
  created_at: string
}

interface Props {
  member: Member
  initialContent: string
  history: MeetingHistory[]
  meetUrl?: string | null
}

export function GeneralMeetingRoom({ member, initialContent, history, meetUrl }: Props) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [meetingActive, setMeetingActive] = useState(false)
  const [copiedName, setCopiedName] = useState(false)

  const saveTimer = useRef<NodeJS.Timeout>(undefined)

  const canEdit = ['admin', 'coordinador'].includes(member.role)

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!canEdit) return
    const newContent = e.target.value
    setContent(newContent)

    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setIsSaving(true)
      await saveNotesAction('general', newContent)
      setLastSaved(new Date())
      setIsSaving(false)
    }, 2000)
  }

  const handleFinalize = async () => {
    if (!confirm('¿Confirmás el cierre de la reunión? Se generará el resumen y se publicará en el Muro.')) return
    setIsFinalizing(true)
    const res = await finalizeAndPublishAction('general', content)
    if (res.success) {
      alert('Reunión finalizada y publicada en el Muro.')
      setContent('')
    } else {
      alert('Error: ' + (res.error || 'No se pudo finalizar la reunión.'))
    }
    setIsFinalizing(false)
  }

  const copiarNombre = () => {
    navigator.clipboard.writeText(member.full_name)
    setCopiedName(true)
    setTimeout(() => setCopiedName(false), 2000)
  }

  return (
    <div className="space-y-10 animate-fade-in">

      {/* ─── BANNER GOOGLE MEET HÍBRIDO ─── */}
      <div className="space-y-4">
        {meetUrl ? (
          <div className="bg-gradient-to-r from-emerald-950/60 to-cyan-950/40 border border-emerald-500/20 rounded-3xl p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Video className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest">Reunión en Vivo</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">Google Meet — Reunión General</h3>
                  <p className="text-xs text-emerald-300/70 mt-0.5">Videollamada abierta para todo el staff</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={meetUrl} target="_blank" rel="noopener noreferrer"
                  className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-emerald-600/20">
                  <ExternalLink className="w-4 h-4" />
                  Unirse a Meet
                </a>
              </div>
            </div>

            {/* Módulo de ayuda */}
            <div className="mt-4 pt-4 border-t border-emerald-500/10 flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300/70">Tu nombre:</span>
                <span className="font-bold text-white">{member.full_name}</span>
                <button onClick={copiarNombre}
                  className="text-emerald-400/60 hover:text-emerald-400 transition-colors" title="Copiar nombre">
                  <Copy className="w-3 h-3" />
                </button>
                {copiedName && <span className="text-[9px] text-emerald-400 font-bold">¡Copiado!</span>}
              </div>
              <span className="text-emerald-500/30 hidden sm:inline">|</span>
              <p className="text-[10px] text-emerald-300/50 italic">
                Tip: Mantén esta pestaña de ITEC abierta junto a Google Meet para usar las herramientas interactivas.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative aspect-video bg-[#0a0f1e] rounded-3xl border border-white/5 overflow-hidden shadow-2xl flex items-center justify-center">
            <div className="absolute top-4 left-4 z-10 bg-slate-700 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md tracking-wider">
              <VideoOff className="w-3 h-3" />
              EN ESPERA
            </div>
            <div className="flex flex-col items-center gap-4 text-center px-6">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <Video className="w-7 h-7 text-blue-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sala de Reunión</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-[280px]">
                  El enlace de Google Meet se activará cuando el coordinador lo configure.
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">En espera</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── PANEL DE MINUTA ─── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ListChecks className="text-amber-500" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Minuta Colaborativa</h2>
              <p className="text-[var(--text-muted)] text-xs uppercase tracking-widest">Memoria Institucional</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest">
            {isSaving ? (
              <span className="text-amber-400 flex items-center gap-2">
                <Loader2 size={12} className="animate-spin" /> Guardando...
              </span>
            ) : lastSaved ? (
              <span className="text-green-400">✓ Sincronizado</span>
            ) : null}
          </div>
        </div>

        <div className="relative group">
          <textarea
            value={content}
            onChange={handleContentChange}
            disabled={!canEdit}
            placeholder={canEdit ? "Escribí aquí los puntos tratados, decisiones y acuerdos de la reunión general..." : "Solo administradores y coordinadores pueden editar la minuta activa."}
            className="w-full min-h-[300px] bg-[var(--bg-surface)] border border-white/5 rounded-3xl p-8 text-[var(--text-secondary)] text-sm leading-relaxed focus:outline-none focus:border-blue-500/30 transition-all resize-none shadow-inner font-mono"
          />
          {!canEdit && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center rounded-3xl border border-white/5">
              <p className="text-[var(--text-muted)] text-xs uppercase tracking-widest">Modo Lectura</p>
            </div>
          )}
        </div>

        {canEdit && (
          <button
            onClick={handleFinalize}
            disabled={isFinalizing || content.length < 20}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 text-purple-300 font-bold text-sm flex items-center justify-center gap-3 hover:from-purple-600/30 hover:to-blue-600/30 transition-all disabled:opacity-30 group"
          >
            {isFinalizing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Procesando con Gemini IA...
              </>
            ) : (
              <>
                <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                Procesar Minuta con IA — Publicar en el Muro
              </>
            )}
          </button>
        )}
      </div>

      {/* ─── HISTORIAL ─── */}
      <div className="space-y-6 pt-10">
        <div className="flex items-center gap-3 mb-6">
          <History className="text-[var(--text-muted)]" size={20} />
          <h2 className="text-lg font-bold text-white">Historial de Encuentros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="glass border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Clock size={14} />
                    <span className="text-[10px] uppercase font-bold tracking-widest">
                      {new Date(item.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <FileText size={16} className="text-[var(--text-muted)] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-white font-semibold text-sm mb-2 line-clamp-1">
                  Reunión — {new Date(item.session_date).toLocaleDateString('es-AR')}
                </h3>
                <p className="text-[var(--text-muted)] text-xs line-clamp-2 leading-relaxed">
                  {item.content?.slice(0, 120) || 'Ver contenido completo'}...
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <p className="text-[var(--text-muted)] text-sm italic">No hay registros de reuniones anteriores.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
