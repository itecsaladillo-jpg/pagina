'use client'

import { useState, useMemo, useTransition, useRef } from 'react'
import type { WhatsAppTemplate, WhatsAppContact } from '@/app/dashboard/whatsapp/actions'
import { saveContactAction, saveContactsBulkAction, updateUnifiedContactAction, deleteUnifiedContactAction } from '@/app/dashboard/whatsapp/actions'
import { buildWaLink, normalizeArgentinaPhone, WhatsAppIcon } from './WhatsAppLinkGenerator'
import { ConfirmDialog } from './ConfirmDialog'
import { useToast } from './Toast'
import { Search, User, Plus, Upload, X, MoreVertical, Pencil, Trash2, ExternalLink, Loader2, Check } from 'lucide-react'

interface MemberContact {
  id: string
  full_name: string
  email: string
  phone: string
}

type UnifiedContact = {
  id: string
  nombre: string
  telefono: string
  email: string | null
  tipo: 'miembro' | WhatsAppContact['fuente']
}

interface Props {
  members: MemberContact[]
  contactsData: WhatsAppContact[]
  onContactUpdated: (c: UnifiedContact) => void
  onContactDeleted: (id: string) => void
  onContactCreated: (c: WhatsAppContact) => void
  onImport: (parsed: { nombre: string; telefono: string; email?: string }[], source: string) => Promise<{ success: boolean; inserted: number }>
}

function parseVCard(text: string): { nombre: string; telefono: string; email?: string }[] {
  const contacts: { nombre: string; telefono: string; email?: string }[] = []
  const cards = text.split('BEGIN:VCARD')
  for (const card of cards) {
    if (!card.trim()) continue
    let nombre = ''
    let telefono = ''
    let email = ''
    const lines = card.split('\n')
    for (const line of lines) {
      if (line.startsWith('FN:')) nombre = line.substring(3).trim()
      if (line.startsWith('TEL')) {
        const val = line.split(':')[1]
        if (val) telefono = val.replace(/\D/g, '').trim()
      }
      if (line.startsWith('EMAIL')) {
        const val = line.split(':')[1]
        if (val) email = val.trim()
      }
    }
    if (nombre && telefono) contacts.push({ nombre, telefono, email: email || undefined })
  }
  return contacts
}

function parseCsv(text: string): { nombre: string; telefono: string; email?: string }[] {
  const lines = text.split('\n')
  const contacts: { nombre: string; telefono: string; email?: string }[] = []
  for (const line of lines) {
    if (!line.trim()) continue
    const cols = line.split(',')
    if (cols.length >= 2) {
      const nombre = cols[0].trim().replace(/^"|"$/g, '')
      let telefono = cols[1].trim().replace(/^"|"$/g, '').replace(/\D/g, '')
      const email = cols[2]?.trim().replace(/^"|"$/g, '') || undefined
      if (nombre && telefono) contacts.push({ nombre, telefono, email })
    }
  }
  return contacts
}

export function ContactosTab({ members, contactsData, onContactUpdated, onContactDeleted, onContactCreated, onImport }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'todos' | 'miembros' | 'externos'>('todos')
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UnifiedContact | null>(null)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const unifiedContacts = useMemo(() => {
    const arr: UnifiedContact[] = []
    members.forEach(m => arr.push({
      id: m.id, nombre: m.full_name, telefono: m.phone, email: m.email, tipo: 'miembro'
    }))
    contactsData.forEach(c => arr.push({
      id: c.id, nombre: c.nombre, telefono: c.telefono, email: c.email, tipo: c.fuente
    }))
    return arr.sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [members, contactsData])

  const filteredList = useMemo(() => {
    const q = search.toLowerCase()
    return unifiedContacts.filter(c => {
      const match = c.nombre.toLowerCase().includes(q) || c.telefono.includes(q)
      if (!match) return false
      if (filter === 'miembros' && c.tipo !== 'miembro') return false
      if (filter === 'externos' && c.tipo === 'miembro') return false
      return true
    })
  }, [unifiedContacts, search, filter])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const type = file.name.endsWith('.vcf') ? 'vcf' : 'csv'
    const reader = new FileReader()
    reader.onload = async event => {
      const text = event.target?.result as string
      const parsed = type === 'vcf' ? parseVCard(text) : parseCsv(text)
      if (parsed.length > 0) {
        startTransition(async () => {
          const res = await onImport(parsed, type)
          if (res.success) {
            toast('success', `${res.inserted} contactos importados.`)
          } else {
            toast('error', 'Error al importar contactos.')
          }
        })
      } else {
        toast('error', 'No se encontraron contactos válidos en el archivo.')
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsText(file, 'utf-8')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header con acciones */}
      <div className="p-4 border-b border-[var(--border-subtle)] bg-[#0f0f0f]/80 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold flex items-center gap-2">
            <User size={18} className="text-[#25d366]" /> Contactos
            <span className="text-xs text-[var(--text-muted)] font-normal ml-1">({unifiedContacts.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 flex items-center gap-1.5"
            >
              <Upload size={13} /> Importar
            </button>
            <button
              onClick={() => { setShowNewForm(true); setEditingId(null) }}
              className="px-3 py-1.5 text-xs font-bold text-black bg-[#25d366] hover:bg-[#1fae53] rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus size={13} /> Nuevo Contacto
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl pl-9 pr-3 py-2 text-white text-sm placeholder:text-[var(--text-muted)] focus:border-[#25d366]/50 outline-none transition-all"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
          {(['todos', 'miembros', 'externos'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 text-[11px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-all ${
                filter === f ? 'bg-white/10 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Formulario inline: Nuevo Contacto */}
      {showNewForm && (
        <InlineContactForm
          onSave={(data) => {
            startTransition(async () => {
              const res = await saveContactAction({ ...data, email: data.email ?? undefined })
              if (res.success) {
                onContactCreated({
                  id: res.id ?? crypto.randomUUID(),
                  nombre: data.nombre,
                  telefono: data.telefono,
                  email: data.email ?? null,
                  fuente: 'manual',
                  es_agenda_itec: true,
                  creado_por: null,
                  created_at: new Date().toISOString(),
                })
                setShowNewForm(false)
                toast('success', 'Contacto creado.')
              } else {
                toast('error', res.error ?? 'Error al guardar.')
              }
            })
          }}
          onCancel={() => setShowNewForm(false)}
          isPending={isPending}
        />
      )}

      {/* Lista de contactos */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {filteredList.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-muted)] text-sm">
            {search ? 'No hay resultados.' : 'No hay contactos. Creá uno o importá un archivo.'}
          </div>
        ) : (
          filteredList.map(c => (
            <div key={c.id}>
              {editingId === c.id ? (
                <InlineContactForm
                  initial={c}
                  onSave={(data) => {
                    startTransition(async () => {
                      const res = await updateUnifiedContactAction(c.id, c.tipo, data)
                      if (res.success) {
                        onContactUpdated({ ...c, ...data })
                        setEditingId(null)
                        toast('success', 'Contacto actualizado.')
                      } else {
                        toast('error', res.error ?? 'Error al actualizar.')
                      }
                    })
                  }}
                  onCancel={() => setEditingId(null)}
                  isPending={isPending}
                />
              ) : (
                <div
                  className="w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 hover:bg-white/5 border border-transparent transition-all group relative"
                  onClick={() => setContextMenu(contextMenu === c.id ? null : c.id)}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    c.tipo === 'miembro' ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-[var(--text-secondary)]'
                  }`}>
                    <User size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-secondary)] truncate">{c.nombre}</p>
                    <p className="text-xs text-[var(--text-muted)] font-mono">+{normalizeArgentinaPhone(c.telefono)}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${c.tipo === 'miembro' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400'}`}>
                    {c.tipo}
                  </span>

                  {/* Menú contextual */}
                  {contextMenu === c.id && (
                    <div className="absolute right-2 top-full mt-1 w-40 bg-[#1a1a1a] border border-[var(--border-subtle)] rounded-xl shadow-xl z-20 overflow-hidden" onClick={e => e.stopPropagation()}>
                      <a
                        href={buildWaLink(c.telefono)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-left px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[#25d366] hover:bg-white/5 flex items-center gap-2"
                      >
                        <ExternalLink size={13} /> Abrir WhatsApp
                      </a>
                      <button
                        onClick={() => { setEditingId(c.id); setContextMenu(null) }}
                        className="w-full text-left px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-white/5 flex items-center gap-2 border-t border-[var(--border-subtle)]"
                      >
                        <Pencil size={13} /> Editar
                      </button>
                      {c.tipo !== 'miembro' && (
                        <button
                          onClick={() => { setDeleteTarget(c); setContextMenu(null) }}
                          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 border-t border-[var(--border-subtle)]"
                        >
                          <Trash2 size={13} /> Eliminar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input de archivo oculto */}
      <input type="file" accept=".vcf,.csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

      {/* Modal de confirmación de eliminación */}
      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar contacto"
          message={`¿Seguro que querés eliminar a "${deleteTarget.nombre}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          variant="danger"
          isPending={isPending}
          onConfirm={() => {
            startTransition(async () => {
              const res = await deleteUnifiedContactAction(deleteTarget.id, deleteTarget.tipo)
              if (res.success) {
                onContactDeleted(deleteTarget.id)
                setDeleteTarget(null)
                toast('success', 'Contacto eliminado.')
              } else {
                toast('error', res.error ?? 'Error al eliminar.')
              }
            })
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

function InlineContactForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: UnifiedContact
  onSave: (data: { nombre: string; telefono: string; email: string | null }) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [telefono, setTelefono] = useState(initial?.telefono ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')

  return (
    <div className="p-3 rounded-xl bg-white/5 border border-[#25d366]/30 mx-1 my-1">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
        <input
          autoFocus
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="Nombre *"
          className="bg-black/40 border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#25d366]"
        />
        <input
          value={telefono}
          onChange={e => setTelefono(e.target.value)}
          placeholder="Teléfono *"
          className="bg-black/40 border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#25d366] font-mono"
        />
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email (opcional)"
          className="bg-black/40 border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#25d366]"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-white transition-colors">
          Cancelar
        </button>
        <button
          onClick={() => onSave({ nombre, telefono, email: email || null })}
          disabled={isPending || !nombre.trim() || !telefono.trim()}
          className="px-3 py-1.5 bg-[#25d366] text-black font-bold text-xs rounded-lg hover:bg-[#1fae53] disabled:opacity-50 flex items-center gap-1.5"
        >
          {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          {initial ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </div>
  )
}
