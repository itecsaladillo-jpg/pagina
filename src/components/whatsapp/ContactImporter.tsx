'use client'

import { useState, useRef, useTransition, useCallback } from 'react'
import { saveContactsBulkAction, saveContactAction, deleteContactAction } from '@/app/dashboard/whatsapp/actions'
import type { WhatsAppContact } from '@/app/dashboard/whatsapp/actions'
import { normalizeArgentinaPhone } from './WhatsAppLinkGenerator'
import {
  Smartphone, FileUp, Table2, PenLine, Contact,
  Upload, CheckCircle2, AlertCircle, Trash2,
  Plus, Loader2, X, Search
} from 'lucide-react'

// ─── Parsers ────────────────────────────────────────────────

interface ParsedContact { nombre: string; telefono: string; email?: string }

/** Parsea un archivo .vcf (vCard 3.0/4.0) en memoria */
function parseVCard(text: string): ParsedContact[] {
  const cards = text.split(/BEGIN:VCARD/i).slice(1)
  return cards.flatMap(card => {
    // Nombre
    const fnMatch = card.match(/^FN[^:]*:(.*)/m)
    const nombre = fnMatch?.[1]?.trim().replace(/\\,/g, ',') ?? ''

    // Teléfono (puede haber varios, tomamos el primero)
    const telMatch = card.match(/^TEL[^:]*:(.*)/m)
    const rawTel = telMatch?.[1]?.trim().replace(/[\s\-()]/g, '') ?? ''

    // Email
    const emailMatch = card.match(/^EMAIL[^:]*:(.*)/m)
    const email = emailMatch?.[1]?.trim() ?? undefined

    if (!nombre || !rawTel) return []
    return [{ nombre, telefono: rawTel, email }]
  })
}

/** Parsea un CSV simple: nombre,telefono[,email] */
function parseCsv(text: string): ParsedContact[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  return lines.flatMap((line, i) => {
    // Saltar encabezado si contiene palabras clave
    if (i === 0 && /nombre|name|telefono|phone/i.test(line)) return []
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    const nombre = cols[0] ?? ''
    const telefono = cols[1]?.replace(/[\s\-()]/g, '') ?? ''
    const email = cols[2] ?? undefined
    if (!nombre || !telefono) return []
    return [{ nombre, telefono, email }]
  })
}

// ─── Props ─────────────────────────────────────────────────

interface Props {
  contacts: WhatsAppContact[]
  onContactsChanged: (contacts: WhatsAppContact[]) => void
}

type ImportTab = 'device' | 'vcf' | 'csv' | 'manual'

// ─── Componente ────────────────────────────────────────────

export function ContactImporter({ contacts, onContactsChanged }: Props) {
  const [tab, setTab] = useState<ImportTab>('vcf')
  const [preview, setPreview] = useState<ParsedContact[] | null>(null)
  const [fileName, setFileName] = useState('')
  const [search, setSearch] = useState('')
  const [showAgendaOnly, setShowAgendaOnly] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  // Detectar soporte de Contact Picker API
  const supportsContactPicker =
    typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window

  const showFeedback = (type: 'ok' | 'err', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 4000)
  }

  // ── Importar desde dispositivo ──
  const handleDeviceImport = useCallback(async () => {
    if (!supportsContactPicker) return
    try {
      // @ts-ignore — API experimental, no está en los tipos estándar
      const selected: any[] = await (navigator as any).contacts.select(
        ['name', 'tel', 'email'],
        { multiple: true }
      )
      const parsed: ParsedContact[] = selected.flatMap(c => {
        const nombre = c.name?.[0] ?? ''
        const telefono = c.tel?.[0] ?? ''
        const email = c.email?.[0] ?? undefined
        if (!nombre || !telefono) return []
        return [{ nombre, telefono, email }]
      })
      setPreview(parsed)
      showFeedback('ok', `${parsed.length} contactos leídos del dispositivo.`)
    } catch (err: any) {
      showFeedback('err', 'No se pudo acceder a los contactos: ' + err.message)
    }
  }, [supportsContactPicker])

  // ── Leer archivo vCard / CSV y guardar automáticamente ──
  const handleFile = useCallback((file: File, type: 'vcf' | 'csv') => {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const parsed = type === 'vcf' ? parseVCard(text) : parseCsv(text)
      
      if (parsed.length === 0) {
        showFeedback('err', 'No se encontraron contactos válidos en el archivo.')
        return
      }

      // Guardar automáticamente en la DB
      startTransition(async () => {
        const res = await saveContactsBulkAction(parsed, type)
        if (res.success) {
          showFeedback('ok', `✅ ${res.inserted} contactos importados y guardados correctamente.`)
          
          // Refrescar lista local (optimistic update)
          const newContacts: WhatsAppContact[] = parsed.map(p => ({
            id: crypto.randomUUID(),
            nombre: p.nombre,
            telefono: p.telefono,
            email: p.email ?? null,
            fuente: type,
            creado_por: null,
            created_at: new Date().toISOString(),
          }))
          
          // Agregamos los nuevos, filtrando duplicados por teléfono por si acaso
          const currentPhones = new Set(contacts.map(c => c.telefono))
          const filteredNew = newContacts.filter(c => !currentPhones.has(c.telefono))
          
          onContactsChanged([...contacts, ...filteredNew])
          setPreview(null)
          setFileName('')
        } else {
          showFeedback('err', res.error ?? 'Error al guardar los contactos en la base de datos.')
        }
      })
    }
    reader.readAsText(file, 'utf-8')
  }, [contacts, onContactsChanged])

  // ── Confirmar importación (para device) ──
  const handleConfirmImport = useCallback((fuente: WhatsAppContact['fuente']) => {
    if (!preview || preview.length === 0) {
      showFeedback('err', 'No hay contactos para importar.')
      return
    }
    startTransition(async () => {
      const res = await saveContactsBulkAction(preview, fuente)
      if (res.success) {
        const skipped = preview.length - res.inserted
        const msg = skipped > 0
          ? `✅ ${res.inserted} importados (${skipped} duplicados omitidos).`
          : `✅ ${res.inserted} contactos importados correctamente.`
        showFeedback('ok', msg)
        setPreview(null)
        setFileName('')
        onContactsChanged([...contacts, ...res.contacts])
      } else {
        showFeedback('err', res.error ?? 'Error al importar.')
      }
    })
  }, [preview, contacts, onContactsChanged])

  // ── Eliminar contacto ──
  const handleDelete = useCallback((id: string) => {
    startTransition(async () => {
      const res = await deleteContactAction(id)
      if (res.success) {
        onContactsChanged(contacts.filter(c => c.id !== id))
      } else {
        showFeedback('err', res.error ?? 'Error al eliminar.')
      }
    })
  }, [contacts, onContactsChanged])

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.nombre.toLowerCase().includes(search.toLowerCase()) || c.telefono.includes(search)
    const matchesAgenda = !showAgendaOnly || c.es_agenda_itec
    return matchesSearch && matchesAgenda
  })

  const IMPORT_TABS: { id: ImportTab; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
    { id: 'device', label: 'Desde teléfono', icon: <Smartphone size={14} />, disabled: !supportsContactPicker },
    { id: 'vcf',    label: 'Archivo .vcf',   icon: <FileUp size={14} /> },
    { id: 'csv',    label: 'CSV',             icon: <Table2 size={14} /> },
    { id: 'manual', label: 'Manual',          icon: <PenLine size={14} /> },
  ]

  return (
    <div className="space-y-6">
      {/* Feedback */}
      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border ${
          feedback.type === 'ok'
            ? 'bg-green-500/10 border-green-500/20 text-green-300'
            : 'bg-red-500/10 border-red-500/20 text-red-300'
        }`}>
          {feedback.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {feedback.msg}
        </div>
      )}

      {/* Tabs de importación */}
      <div>
        <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mb-3">Importar contactos</p>
        <div className="flex gap-1 p-1 rounded-xl bg-white/3 border border-[var(--border-subtle)] w-fit">
          {IMPORT_TABS.map(t => (
            <button
              key={t.id}
              type="button"
              disabled={t.disabled}
              onClick={() => { setTab(t.id); setPreview(null); setFileName('') }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                tab === t.id
                  ? 'bg-[#25d366]/15 text-[#25d366] border border-[#25d366]/25'
                  : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5'
              }`}
            >
              {t.icon}
              {t.label}
              {t.id === 'device' && !supportsContactPicker && (
                <span className="text-[9px] opacity-50">(solo móvil)</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Panel de importación según tab */}
      <div className="glass border border-[var(--border-subtle)] rounded-2xl p-5">
        {tab === 'device' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-14 h-14 rounded-2xl bg-[#25d366]/10 flex items-center justify-center text-[#25d366] mx-auto">
              <Smartphone size={28} />
            </div>
            <div>
              <p className="text-white font-semibold mb-1">Importar contactos del teléfono</p>
              <p className="text-[var(--text-muted)] text-xs max-w-xs mx-auto">
                Abre el selector de contactos nativo de tu dispositivo. Solo disponible en Chrome Android e iOS Safari.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDeviceImport}
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25d366]/10 hover:bg-[#25d366]/20 border border-[#25d366]/25 text-[#25d366] font-semibold text-sm transition-all mx-auto"
            >
              {isPending ? <Loader2 size={15} className="animate-spin" /> : <Smartphone size={15} />}
              Seleccionar contactos
            </button>
          </div>
        )}

        {tab === 'vcf' && (
          <VcfImport
            fileName={fileName}
            preview={preview}
            isPending={isPending}
            fileRef={fileRef}
            onFile={(f: File) => handleFile(f, 'vcf')}
            onConfirm={() => handleConfirmImport('vcf')}
            onCancel={() => { setPreview(null); setFileName('') }}
          />
        )}

        {tab === 'csv' && (
          <CsvImport
            fileName={fileName}
            preview={preview}
            isPending={isPending}
            fileRef={fileRef}
            onFile={(f: File) => handleFile(f, 'csv')}
            onConfirm={() => handleConfirmImport('csv')}
            onCancel={() => { setPreview(null); setFileName('') }}
          />
        )}

        {tab === 'manual' && (
          <ManualForm
            isPending={isPending}
            onSave={async (nombre, telefono, email) => {
              startTransition(async () => {
                const res = await saveContactAction({ nombre, telefono, email, fuente: 'manual' })
                if (res.success) {
                  onContactsChanged([...contacts, {
                    id: res.id ?? crypto.randomUUID(),
                    nombre, telefono, email: email || null, fuente: 'manual',
                    es_agenda_itec: true,
                    creado_por: null, created_at: new Date().toISOString(),
                  }])
                  showFeedback('ok', 'Contacto agregado.')
                } else {
                  showFeedback('err', res.error ?? 'Error.')
                }
              })
            }}
          />
        )}

        {/* Preview de contactos a importar */}
        {preview && preview.length > 0 && tab !== 'manual' && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">
              Preview — {preview.length} contactos
            </p>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {preview.slice(0, 50).map((c, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/3 text-sm">
                  <span className="text-white font-medium flex-1 truncate">{c.nombre}</span>
                  <span className="text-[var(--text-muted)] font-mono text-xs">{c.telefono}</span>
                </div>
              ))}
              {preview.length > 50 && (
                <p className="text-center text-[var(--text-muted)] text-xs py-1">… y {preview.length - 50} más</p>
              )}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleConfirmImport(tab as WhatsAppContact['fuente'])}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25d366]/10 hover:bg-[#25d366]/20 border border-[#25d366]/25 text-[#25d366] text-sm font-semibold disabled:opacity-30 transition-all"
              >
                {isPending ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                {isPending ? 'Importando…' : `Importar ${preview.length} contactos`}
              </button>
              <button
                type="button"
                onClick={() => { setPreview(null); setFileName('') }}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-muted)] hover:text-white text-sm transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de contactos guardados */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">
            Contactos guardados ({filteredContacts.length}{showAgendaOnly ? ` / ${contacts.length}` : ''})
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAgendaOnly(!showAgendaOnly)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                showAgendaOnly
                  ? 'bg-[#25d366]/15 text-[#25d366] border-[#25d366]/25'
                  : 'bg-white/5 text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-white hover:bg-white/10'
              }`}
            >
              <Contact size={11} />
              Agenda ITEC
            </button>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar…"
                className="bg-white/5 border border-[var(--border-subtle)] rounded-lg pl-7 pr-3 py-1.5 text-white text-xs placeholder:text-[var(--text-muted)]/50 focus:border-[var(--accent-primary)] outline-none w-44 transition-all"
              />
            </div>
          </div>
        </div>

        {filteredContacts.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-[var(--border-subtle)] rounded-2xl text-[var(--text-muted)] text-sm">
            {contacts.length === 0 ? 'Todavía no importaste ningún contacto.' : 'Sin resultados.'}
          </div>
        ) : (
          <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
            {filteredContacts.map(c => (
              <div
                key={c.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/3 border border-[var(--border-subtle)]/50 hover:border-[var(--border-subtle)] group transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] shrink-0">
                  {c.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{c.nombre}</p>
                  <p className="text-[var(--text-muted)] text-xs font-mono">+{normalizeArgentinaPhone(c.telefono)}</p>
                </div>
                <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${
                  c.fuente === 'vcf'    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                  c.fuente === 'csv'    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                  c.fuente === 'device' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                  'bg-white/5 border-white/10 text-[var(--text-muted)]'
                }`}>
                  {c.fuente}
                </span>
                {c.es_agenda_itec && (
                  <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full border font-medium bg-[#25d366]/10 border-[#25d366]/20 text-[#25d366]">
                    ITEC
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  disabled={isPending}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-componentes ─────────────────────────────────────────

function DropZone({ accept, label, hint, onFile, fileRef }: {
  accept: string; label: string; hint: string
  onFile: (f: File) => void; fileRef: React.RefObject<HTMLInputElement>
}) {
  return (
    <div
      className="border-2 border-dashed border-[var(--border-subtle)] hover:border-[#25d366]/40 rounded-2xl p-8 text-center cursor-pointer transition-all group"
      onClick={() => fileRef.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault()
        const f = e.dataTransfer.files[0]
        if (f) onFile(f)
      }}
    >
      <Upload size={28} className="text-[var(--text-muted)] group-hover:text-[#25d366] mx-auto mb-3 transition-colors" />
      <p className="text-white text-sm font-semibold mb-1">{label}</p>
      <p className="text-[var(--text-muted)] text-xs">{hint}</p>
      <input ref={fileRef} type="file" accept={accept} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
    </div>
  )
}

function VcfImport({ fileName, preview, isPending, fileRef, onFile, onConfirm, onCancel }: any) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-white text-sm font-semibold mb-1">Importar archivo vCard (.vcf)</p>
        <p className="text-[var(--text-muted)] text-xs mb-4">
          Exportá tus contactos desde el teléfono: Contactos → Menú → Exportar → <code>.vcf</code>. Luego subí ese archivo acá.
        </p>
      </div>
      {!preview ? (
        <DropZone
          accept=".vcf,text/vcard"
          label="Arrastrá tu archivo .vcf o hacé clic"
          hint="Compatible con Android, iOS, Google Contacts, Outlook"
          onFile={onFile}
          fileRef={fileRef}
        />
      ) : (
        <div className="text-sm text-[var(--text-muted)]">Archivo: <span className="text-white">{fileName}</span></div>
      )}
    </div>
  )
}

function CsvImport({ fileName, preview, isPending, fileRef, onFile, onConfirm, onCancel }: any) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-white text-sm font-semibold mb-1">Importar CSV</p>
        <p className="text-[var(--text-muted)] text-xs mb-1">
          El archivo debe tener columnas en este orden: <code className="text-[#25d366]">nombre, telefono, email</code> (email es opcional).
        </p>
        <p className="text-[var(--text-muted)] text-xs mb-4">
          La primera fila puede ser un encabezado — se ignora automáticamente.
        </p>
      </div>
      {!preview ? (
        <DropZone
          accept=".csv,text/csv"
          label="Arrastrá tu archivo .csv o hacé clic"
          hint="Formato: nombre,telefono,email (una fila por contacto)"
          onFile={onFile}
          fileRef={fileRef}
        />
      ) : (
        <div className="text-sm text-[var(--text-muted)]">Archivo: <span className="text-white">{fileName}</span></div>
      )}
    </div>
  )
}

function ManualForm({ isPending, onSave }: { isPending: boolean; onSave: (n: string, t: string, e: string) => void }) {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = () => {
    if (!nombre.trim() || !telefono.trim()) return
    onSave(nombre, telefono, email)
    setNombre(''); setTelefono(''); setEmail('')
  }

  return (
    <div className="space-y-4">
      <p className="text-white text-sm font-semibold">Agregar contacto manualmente</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">Nombre *</label>
          <input
            type="text" value={nombre} onChange={e => setNombre(e.target.value)}
            placeholder="Juan García"
            className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[var(--text-muted)]/50 focus:border-[var(--accent-primary)] outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">Teléfono *</label>
          <input
            type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
            placeholder="+54 9 2344 000000"
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
            className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-white text-sm font-mono placeholder:text-[var(--text-muted)]/50 focus:border-[var(--accent-primary)] outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">Email <span className="opacity-50">(opcional)</span></label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="juan@ejemplo.com"
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
            className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[var(--text-muted)]/50 focus:border-[var(--accent-primary)] outline-none transition-all"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || !nombre.trim() || !telefono.trim()}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25d366]/10 hover:bg-[#25d366]/20 border border-[#25d366]/25 text-[#25d366] text-sm font-semibold disabled:opacity-30 transition-all"
      >
        {isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
        Agregar contacto
      </button>
    </div>
  )
}
