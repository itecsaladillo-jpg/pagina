'use client'

import { useState, useRef } from 'react'
import { 
  Video, 
  ListChecks, 
  History, 
  Sparkles, 
  Users,
  FileText,
  Loader2,
  Clock
} from 'lucide-react'
import { saveNotesAction, finalizeAndPublishAction } from '@/app/dashboard/reuniones/actions'
import { JitsiMeetingEmbed } from '@/components/video/JitsiMeetingEmbed'

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
}

export function GeneralMeetingRoom({ member, initialContent, history }: Props) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [meetingActive, setMeetingActive] = useState(false)
  
  const saveTimer = useRef<NodeJS.Timeout>(undefined)
  
  const canEdit = ['admin', 'coordinador'].includes(member.role)

  // Auto-guardado
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!canEdit) return
    const newContent = e.target.value
    setContent(newContent)
    
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setIsSaving(true)
      // Usamos 'general' como ID especial o null si el action lo permite
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

  return (
    <div className="space-y-10 animate-fade-in">
      {/* ─── JITSI EMBED O LOBBY ─── */}
      {meetingActive ? (
        <div className="space-y-4">
          <div className="relative aspect-video bg-black rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="absolute top-4 left-4 z-10 bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              EN VIVO
            </div>
            <JitsiMeetingEmbed
              roomName="itec-reunion-general"
              displayName={member.full_name || 'Asistente ITEC'}
              email={member.email || ''}
              className="w-full h-full"
            />
          </div>
          <button
            onClick={() => setMeetingActive(false)}
            className="w-full py-3 rounded-2xl bg-red-600/20 border border-red-500/30 text-red-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-600/30 transition-all"
          >
            Salir de la reunión
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Lado Izquierdo: Preview */}
          <div className="space-y-4">
            <div className="relative aspect-video bg-[#0a0f1e] rounded-3xl border border-white/5 overflow-hidden flex items-center justify-center shadow-2xl">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                  {member.full_name?.charAt(0) || 'A'}
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 text-[10px] font-bold uppercase tracking-widest">Listo para unirte</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lado Derecho: Info y Acceso */}
          <div className="space-y-6 lg:pl-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-white tracking-tight">Reunión General ITEC</h1>
              <p className="text-[var(--text-secondary)] text-sm flex items-center gap-2">
                <Users size={14} className="text-blue-400" />
                <span>Espacio abierto para todo el staff</span>
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-[var(--text-muted)]">
                <span>Estado de la sala</span>
                <span className="text-green-400 font-bold">Disponible</span>
              </div>
              <button
                onClick={() => setMeetingActive(true)}
                className="w-full py-4 px-6 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-900/20 group"
              >
                <Video size={20} />
                Unirse ahora
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="section-divider" />

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
