'use client'

import { useState, useTransition, useRef } from 'react'
import type { WhatsAppContact, WhatsAppTemplate } from '@/app/dashboard/whatsapp/types'
import type { WhatsAppGroupWithCount } from '@/app/dashboard/whatsapp/types'
import { getGroupWithContactsAction, logWhatsAppSendAction, saveTemplateAction } from '@/app/dashboard/whatsapp/actions'
import { buildWaLink, replacePlaceholders } from '@/lib/waPhone'
import { useToast } from './shared/Toast'
import {
  Send, Copy, ExternalLink, Loader2, Check, CheckCircle2, Circle, MessageSquare,
  FileText, Save, X, ChevronDown,
} from 'lucide-react'

interface Props {
  groups: WhatsAppGroupWithCount[]
  templates: WhatsAppTemplate[]
}

export function SendSection({ groups, templates }: Props) {
  const [groupId, setGroupId] = useState('')
  const [message, setMessage] = useState('')
  const [recipients, setRecipients] = useState<WhatsAppContact[]>([])
  const [processed, setProcessed] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [showSaveTpl, setShowSaveTpl] = useState(false)
  const [tplTitle, setTplTitle] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const toast = useToast()
  const reqIdRef = useRef(0)

  // Seleccionar grupo → cargar destinatarios
  const handleGroupChange = (id: string) => {
    const reqId = ++reqIdRef.current
    setGroupId(id)
    setRecipients([])
    setProcessed(new Set())
    if (!id) return
    setIsLoading(true)
    getGroupWithContactsAction(id).then((res) => {
      if (reqId !== reqIdRef.current) return
      if (res.success && res.data) {
        setRecipients(res.data.contacts)
      } else {
        toast('error', res.error ?? 'Error al cargar contactos del grupo')
      }
      setIsLoading(false)
    })
  }

  const buildLink = (c: WhatsAppContact) => {
    const text = replacePlaceholders(message, { nombre: c.nombre })
    return buildWaLink(c.telefono, text)
  }

  const openChat = (c: WhatsAppContact) => {
    window.open(buildLink(c), '_blank', 'noopener')
    setProcessed((prev) => new Set(prev).add(c.id))
  }

  const pendingList = recipients.filter((c) => !processed.has(c.id))

  const openNext = () => {
    const next = pendingList[0]
    if (!next) {
      toast('info', 'No quedan contactos pendientes.')
      return
    }
    openChat(next)
  }

  const copyAll = async () => {
    if (!recipients.length || !message.trim()) return
    const lines = recipients.map((c) => `${c.nombre}: ${buildLink(c)}`)
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      toast('success', `${lines.length} links copiados al portapapeles.`)
    } catch {
      toast('error', 'No se pudieron copiar los links.')
    }
  }

  const logSend = () => {
    if (!message.trim() || !recipients.length) return
    startTransition(async () => {
      const res = await logWhatsAppSendAction(
        recipients.map((c) => ({
          destinatario_numero: c.telefono,
          destinatario_nombre: c.nombre,
          mensaje_enviado: message,
        }))
      )
      if (res.success) toast('success', `Envío registrado: ${recipients.length} destinatarios.`)
      else toast('error', res.error ?? 'Error al registrar el envío')
    })
  }

  const saveAsTemplate = () => {
    if (!tplTitle.trim() || !message.trim()) return
    startTransition(async () => {
      const res = await saveTemplateAction({ titulo: tplTitle.trim(), contenido: message })
      if (res.success) {
        toast('success', 'Plantilla guardada.')
        setShowSaveTpl(false)
        setTplTitle('')
      } else {
        toast('error', res.error ?? 'Error al guardar plantilla')
      }
    })
  }

  const selectedGroup = groups.find((g) => g.id === groupId)
  const progress = recipients.length ? Math.round((processed.size / recipients.length) * 100) : 0

  return (
    <div className="p-4 space-y-4">
      {/* ── Selector de grupo destino ── */}
      <div>
        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
          Grupo destino
        </label>
        <div className="relative">
          <select
            value={groupId}
            onChange={(e) => handleGroupChange(e.target.value)}
            className="w-full appearance-none bg-black/40 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#25d366] cursor-pointer"
          >
            <option value="">— Seleccioná un grupo —</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre_grupo} ({g.contact_count ?? 0} contactos)
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
        </div>
      </div>

      {/* ── Editor de mensaje ── */}
      <div className="bg-white/5 border border-[var(--border-subtle)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Mensaje
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-[11px] font-bold text-[var(--text-muted)] hover:text-white flex items-center gap-1"
            >
              <MessageSquare size={12} /> Vista previa
            </button>
            <button
              onClick={() => setShowSaveTpl(true)}
              disabled={!message.trim()}
              className="text-[11px] font-bold text-[#25d366] hover:underline disabled:opacity-40 flex items-center gap-1"
            >
              <Save size={12} /> Guardar como plantilla
            </button>
          </div>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={'Escribí el mensaje acá...\n\nSoporta *negrita*, _cursiva_, emojis y {{nombre}} para el nombre del contacto.'}
          rows={5}
          className="w-full bg-black/40 border border-[var(--border-subtle)] rounded-lg p-3 text-white text-sm custom-scrollbar mb-2 focus:outline-none focus:border-[#25d366] resize-y"
        />

        {/* Formato de ayuda */}
        <div className="flex gap-3 text-[10px] text-[var(--text-muted)] mb-2">
          <span>
            <strong className="text-white">*texto*</strong> → negrita
          </span>
          <span>
            <em className="text-white">_texto_</em> → cursiva
          </span>
          <span>
            <code className="text-white">{'{{nombre}}'}</code> → nombre del contacto
          </span>
        </div>

        {/* Preview */}
        {showPreview && message.trim() && (
          <div className="bg-[#0b141a] border border-[#25d366]/20 rounded-lg p-3 text-sm text-white whitespace-pre-wrap">
            <RenderWaFormat text={replacePlaceholders(message, { nombre: 'Juan Pérez' })} />
          </div>
        )}

        {/* Guardar como plantilla */}
        {showSaveTpl && (
          <div className="flex gap-2 mt-2 p-2 bg-white/5 rounded-lg border border-[var(--border-subtle)]">
            <input
              autoFocus
              value={tplTitle}
              onChange={(e) => setTplTitle(e.target.value)}
              placeholder="Título de la plantilla"
              className="flex-1 bg-black/40 border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#25d366]"
            />
            <button
              onClick={saveAsTemplate}
              disabled={isPending || !tplTitle.trim()}
              className="px-3 py-2 bg-[#25d366] text-black font-bold text-xs rounded-lg hover:bg-[#1fae53] disabled:opacity-50 flex items-center gap-1"
            >
              {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Guardar
            </button>
            <button
              onClick={() => setShowSaveTpl(false)}
              className="px-2 py-2 text-[var(--text-muted)] hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Plantillas existentes */}
        {templates.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto custom-scrollbar pb-1">
            <FileText size={12} className="text-[var(--text-muted)] shrink-0" />
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setMessage(t.contenido)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[11px] text-white border border-white/10 transition-colors"
                title={t.titulo}
              >
                {t.titulo}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Panel de exportación y envío ── */}
      {groupId && (
        <div className="bg-white/5 border border-[var(--border-subtle)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Exportación a WhatsApp Web
              </p>
              <p className="text-sm text-white mt-0.5">
                {selectedGroup?.nombre_grupo} ·{' '}
                <span className="text-[#25d366] font-bold">
                  {processed.size}/{recipients.length}
                </span>{' '}
                procesados
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyAll}
                disabled={!message.trim() || !recipients.length}
                className="px-3 py-2 text-xs font-bold text-[var(--text-secondary)] bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 flex items-center gap-1.5 disabled:opacity-40"
              >
                <Copy size={13} /> Copiar todos
              </button>
              <button
                onClick={logSend}
                disabled={!message.trim() || !recipients.length || isPending}
                className="px-3 py-2 text-xs font-bold text-[var(--text-secondary)] bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 flex items-center gap-1.5 disabled:opacity-40"
              >
                {isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Registrar envío
              </button>
              <button
                onClick={openNext}
                disabled={!message.trim() || pendingList.length === 0}
                className="px-4 py-2 text-xs font-bold text-black bg-[#25d366] hover:bg-[#1fae53] rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40"
              >
                <Send size={13} /> Abrir siguiente ({pendingList.length})
              </button>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-[#25d366] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Lista de destinatarios con estado */}
          {isLoading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="animate-spin text-[var(--text-muted)]" size={24} />
            </div>
          ) : recipients.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-4">
              Este grupo no tiene contactos. Asignalos en la pestaña Grupos.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto custom-scrollbar">
              {recipients.map((c) => {
                const done = processed.has(c.id)
                return (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                      done
                        ? 'bg-[#25d366]/5 border-[#25d366]/20'
                        : 'bg-white/5 border-transparent hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {done ? (
                        <CheckCircle2 size={16} className="text-[#25d366] shrink-0" />
                      ) : (
                        <Circle size={16} className="text-[var(--text-muted)] shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${done ? 'text-[#25d366]' : 'text-white'}`}>
                          {c.nombre}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono truncate">
                          {c.telefono}
                        </p>
                      </div>
                    </div>
                    <a
                      href={buildLink(c)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setProcessed((prev) => new Set(prev).add(c.id))}
                      className="shrink-0 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#25d366] hover:bg-[#25d366]/10 transition-colors"
                      title="Abrir chat"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {!groupId && (
        <div className="text-center py-10 text-[var(--text-muted)] text-sm">
          Seleccioná un grupo destino para comenzar.
        </div>
      )}
    </div>
  )
}

// ── Render de formato WhatsApp (*negrita*, _cursiva_) ───────

function RenderWaFormat({ text }: { text: string }) {
  const parts = text.split(/(\*[^*\n]+\*|_[^_\n]+_)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (/^\*[^*\n]+\*$/.test(p)) return <strong key={i}>{p.slice(1, -1)}</strong>
        if (/^_[^_\n]+_$/.test(p)) return <em key={i}>{p.slice(1, -1)}</em>
        return <span key={i}>{p}</span>
      })}
    </>
  )
}
