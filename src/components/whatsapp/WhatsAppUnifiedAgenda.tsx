'use client'

import { useState, useMemo, useTransition, useCallback, useRef } from 'react'
import type { WhatsAppTemplate, WhatsAppContact, WhatsAppGroup } from '@/app/dashboard/whatsapp/actions'
import {
  saveGroupAction, deleteGroupAction, setGroupContactsAction,
  getGroupWithContactsAction, saveContactsBulkAction
} from '@/app/dashboard/whatsapp/actions'
import { WhatsAppLinkGenerator, WhatsAppIcon, ITEC_WHATSAPP_NUMBER, buildWaLink, normalizeArgentinaPhone } from './WhatsAppLinkGenerator'
import { TemplateEditor } from './TemplateEditor'
import { Search, Users, User, Plus, X, Upload, MoreVertical, Copy, Loader2, Settings } from 'lucide-react'

// ─── Helpers y Tipos ────────────────────────────────────────────────

interface MemberContact {
  id: string
  full_name: string
  email: string
  phone: string
}

interface Props {
  members: MemberContact[]
  templates: WhatsAppTemplate[]
  contactsData?: WhatsAppContact[]
  groupsData?: WhatsAppGroup[]
}

type UnifiedContact = {
  id: string
  nombre: string
  telefono: string
  email: string | null
  tipo: 'miembro' | WhatsAppContact['fuente']
}

type AgendaFilter = 'todos' | 'miembros' | 'externos' | 'grupos'
type SelectedItem = { type: 'contact', data: UnifiedContact } | { type: 'group', data: WhatsAppGroup } | null

// Parseadores simples extraídos del ContactImporter anterior
function parseVCard(text: string): { nombre: string, telefono: string, email?: string }[] {
  const contacts: { nombre: string, telefono: string, email?: string }[] = []
  const cards = text.split('BEGIN:VCARD')
  for (const card of cards) {
    if (!card.trim()) continue
    let nombre = ''
    let telefono = ''
    const lines = card.split('\n')
    for (const line of lines) {
      if (line.startsWith('FN:')) nombre = line.substring(3).trim()
      if (line.startsWith('TEL')) {
        const val = line.split(':')[1]
        if (val) telefono = val.replace(/\D/g, '').trim()
      }
    }
    if (nombre && telefono) contacts.push({ nombre, telefono })
  }
  return contacts
}

function parseCsv(text: string): { nombre: string, telefono: string, email?: string }[] {
  const lines = text.split('\n')
  const contacts: { nombre: string, telefono: string, email?: string }[] = []
  for (const line of lines) {
    if (!line.trim()) continue
    const cols = line.split(',')
    if (cols.length >= 2) {
      const nombre = cols[0].trim().replace(/^"|"$/g, '')
      let telefono = cols[1].trim().replace(/^"|"$/g, '').replace(/\D/g, '')
      if (nombre && telefono) contacts.push({ nombre, telefono })
    }
  }
  return contacts
}

function replacePlaceholders(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

// ─── Componente Principal ─────────────────────────────────────────

export function WhatsAppUnifiedAgenda({ members, templates: initialTemplates, contactsData = [], groupsData = [] }: Props) {
  const [contacts, setContacts] = useState<WhatsAppContact[]>(contactsData)
  const [groups, setGroups] = useState<WhatsAppGroup[]>(groupsData)
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(initialTemplates)
  
  const [filter, setFilter] = useState<AgendaFilter>('todos')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SelectedItem>(null)
  
  // Modals
  const [showImportModal, setShowImportModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  
  const [isPending, startTransition] = useTransition()

  // ── Unificación de lista ──
  const unifiedContacts = useMemo(() => {
    const arr: UnifiedContact[] = []
    members.forEach(m => arr.push({
      id: m.id, nombre: m.full_name, telefono: m.phone, email: m.email, tipo: 'miembro'
    }))
    contacts.forEach(c => arr.push({
      id: c.id, nombre: c.nombre, telefono: c.telefono, email: c.email, tipo: c.fuente
    }))
    return arr.sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [members, contacts])

  const filteredList = useMemo(() => {
    const q = search.toLowerCase()
    
    if (filter === 'grupos') {
      return groups.filter(g => g.nombre.toLowerCase().includes(q))
    }
    
    return unifiedContacts.filter(c => {
      const match = c.nombre.toLowerCase().includes(q) || c.telefono.includes(q)
      if (!match) return false
      if (filter === 'miembros' && c.tipo !== 'miembro') return false
      if (filter === 'externos' && c.tipo === 'miembro') return false
      return true
    })
  }, [unifiedContacts, groups, search, filter])

  // ── Importación automática de archivos (VCF/CSV) ──
  const fileInputRef = useRef<HTMLInputElement>(null)
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
          const res = await saveContactsBulkAction(parsed, type)
          if (res.success) {
            const newContacts: WhatsAppContact[] = parsed.map(p => ({
              id: crypto.randomUUID(), nombre: p.nombre!, telefono: p.telefono!, email: null,
              fuente: type, es_agenda_itec: true, creado_por: null, created_at: new Date().toISOString()
            }))
            const currentPhones = new Set(contacts.map(c => c.telefono))
            setContacts(prev => [...prev, ...newContacts.filter(c => !currentPhones.has(c.telefono))])
            setShowImportModal(false)
            alert(`✅ ${res.inserted} contactos importados a la base de datos.`)
          } else {
            alert('Error al guardar los contactos.')
          }
        })
      } else {
        alert('No se encontraron contactos válidos en el archivo.')
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsText(file, 'utf-8')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in h-[700px]">
      
      {/* ========================================== */}
      {/* COLUMNA IZQUIERDA: AGENDA */}
      {/* ========================================== */}
      <div className="lg:col-span-1 glass border border-[var(--border-subtle)] rounded-2xl flex flex-col overflow-hidden h-full">
        <div className="p-4 border-b border-[var(--border-subtle)] space-y-3 bg-[#0f0f0f]/80 backdrop-blur-md">
          {/* Header Agenda */}
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold flex items-center gap-2">
              <Users size={18} className="text-[#25d366]" /> Agenda ITEC
            </h2>
            <div className="relative group">
              <button className="w-8 h-8 rounded-full bg-[#25d366]/10 text-[#25d366] flex items-center justify-center hover:bg-[#25d366]/20 transition-colors">
                <Plus size={16} />
              </button>
              {/* Dropdown Agregar */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a1a] border border-[var(--border-subtle)] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden">
                <button onClick={() => setShowImportModal(true)} className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-white/5 flex items-center gap-2">
                  <Upload size={14} /> Importar Contactos
                </button>
                <button onClick={() => setShowGroupModal(true)} className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-white/5 flex items-center gap-2 border-t border-[var(--border-subtle)]">
                  <Users size={14} /> Crear Grupo
                </button>
              </div>
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

          {/* Filtros segmentados */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-lg overflow-x-auto no-scrollbar">
            {['todos', 'miembros', 'externos', 'grupos'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as AgendaFilter)}
                className={`flex-1 min-w-[70px] text-[11px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-all ${
                  filter === f ? 'bg-white/10 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Lista scrolleable */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredList.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-muted)] text-sm">No hay resultados.</div>
          ) : (
            filteredList.map((item: any) => {
              const isGroup = filter === 'grupos'
              const isSelected = selected?.data.id === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => setSelected({ type: isGroup ? 'group' : 'contact', data: item })}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all ${
                    isSelected ? 'bg-[#25d366]/15 border border-[#25d366]/30' : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    isGroup ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'bg-white/5 text-[var(--text-secondary)]'
                  }`}>
                    {isGroup ? <Users size={16} /> : <User size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
                      {item.nombre}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate font-mono">
                      {isGroup ? `${item.contact_count ?? 0} miembros` : `+${normalizeArgentinaPhone(item.telefono)}`}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>


      {/* ========================================== */}
      {/* COLUMNA DERECHA: CHAT / CONTEXTO */}
      {/* ========================================== */}
      <div className="lg:col-span-2 glass border border-[var(--border-subtle)] rounded-2xl flex flex-col overflow-hidden h-full">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-[#25d366]/10 text-[#25d366] flex items-center justify-center mb-4">
              <WhatsAppIcon size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">WhatsApp Web Integrado</h3>
            <p className="text-[var(--text-muted)] text-sm max-w-sm">
              Seleccioná un contacto o un grupo de la agenda para comenzar a enviar mensajes directamente desde tu WhatsApp vinculado.
            </p>
            <div className="mt-6 flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
              <span className="w-2 h-2 rounded-full bg-[#25d366] animate-pulse"></span>
              Línea activa: <span className="font-mono text-white">+{ITEC_WHATSAPP_NUMBER}</span>
            </div>
          </div>
        ) : selected.type === 'contact' ? (
          <ContactChat
            contact={selected.data as UnifiedContact}
            templates={templates}
            onManageTemplates={() => setShowTemplateModal(true)}
          />
        ) : (
          <GroupChat
            group={selected.data as WhatsAppGroup}
            allContacts={contacts}
            templates={templates}
            onGroupUpdated={g => setGroups(prev => prev.map(x => x.id === g.id ? g : x))}
            onGroupDeleted={id => {
              setGroups(prev => prev.filter(x => x.id !== id))
              setSelected(null)
            }}
          />
        )}
      </div>

      {/* ========================================== */}
      {/* MODALS RÁPIDOS */}
      {/* ========================================== */}

      {/* Modal: Importar VCF/CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass border border-[var(--border-subtle)] rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowImportModal(false)} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Importar Contactos</h3>
            <p className="text-sm text-[var(--text-muted)] mb-6">Subí un archivo .vcard (exportado de tu teléfono) o un .csv para guardar los contactos en la base de datos de ITEC.</p>
            
            <div className="border-2 border-dashed border-[var(--border-subtle)] rounded-xl p-8 text-center hover:border-[#25d366]/50 transition-colors bg-white/2">
              <Upload size={32} className="mx-auto text-[var(--text-muted)] mb-3" />
              <p className="text-sm text-white font-medium mb-1">Arrastrá un archivo o hacé clic</p>
              <p className="text-xs text-[var(--text-muted)] mb-4">Soporta .vcf y .csv</p>
              <input type="file" accept=".vcf,.csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <button onClick={() => fileInputRef.current?.click()} disabled={isPending} className="px-4 py-2 bg-[#25d366] text-black font-bold text-sm rounded-lg hover:bg-[#1fae53] transition-colors">
                {isPending ? 'Procesando...' : 'Seleccionar Archivo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Crear Grupo */}
      {showGroupModal && (
        <CreateGroupModal
          onClose={() => setShowGroupModal(false)}
          onCreated={g => { setGroups([...groups, g]); setShowGroupModal(false); setSelected({ type: 'group', data: g }) }}
        />
      )}

      {/* Modal: Gestionar Plantillas */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass border border-[var(--border-subtle)] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative">
            <button onClick={() => setShowTemplateModal(false)} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">Gestor de Plantillas</h3>
            <TemplateEditor templates={templates} />
          </div>
        </div>
      )}

    </div>
  )
}

// ─── Sub-componentes Contextuales ──────────────────────────────────────

function ContactChat({ contact, templates, onManageTemplates }: { contact: UnifiedContact, templates: WhatsAppTemplate[], onManageTemplates: () => void }) {
  const [msg, setMsg] = useState('')
  const [selTemplate, setSelTemplate] = useState('')

  const finalMsg = replacePlaceholders(msg || (templates.find(t => t.id === selTemplate)?.cuerpo ?? ''), {
    nombre: contact.nombre.split(' ')[0],
    email: contact.email ?? ''
  })

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center gap-4 bg-[#0f0f0f]/80">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
          <User size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{contact.nombre}</h3>
          <p className="text-sm text-[var(--text-muted)] font-mono">+{normalizeArgentinaPhone(contact.telefono)} • Origen: {contact.tipo}</p>
        </div>
      </div>
      
      <div className="flex-1 p-6 flex flex-col justify-end bg-[url('/img/wa-bg.png')] bg-center bg-cover bg-no-repeat relative">
        <div className="absolute inset-0 bg-[#0f0f0f]/70"></div>
        <div className="relative z-10 bg-[#1a1a1a] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Redactar Mensaje</label>
            <div className="flex items-center gap-2">
              <select
                value={selTemplate}
                onChange={e => { setSelTemplate(e.target.value); setMsg('') }}
                className="bg-white/5 border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-xs text-white outline-none w-48 truncate"
              >
                <option value="">-- Elegir plantilla --</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
              </select>
              <button onClick={onManageTemplates} className="p-1.5 text-[var(--text-muted)] hover:text-white rounded-md hover:bg-white/10" title="Gestionar Plantillas">
                <Settings size={14} />
              </button>
            </div>
          </div>
          
          <textarea
            value={msg || (templates.find(t => t.id === selTemplate)?.cuerpo ?? '')}
            onChange={e => { setMsg(e.target.value); setSelTemplate('') }}
            placeholder="Escribí el mensaje acá... Podes usar {{nombre}}"
            rows={4}
            className="w-full bg-transparent border-none text-white text-sm resize-none outline-none placeholder:text-white/20"
          />
          
          <div className="mt-4 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
            <p className="text-xs text-[var(--text-muted)]">El mensaje se abrirá en WhatsApp Web listo para enviar.</p>
            <a
              href={buildWaLink(contact.telefono, finalMsg || undefined)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#25d366] text-black font-bold text-sm rounded-xl hover:bg-[#1fae53] transition-colors shadow-[0_0_15px_rgba(37,211,102,0.3)]"
            >
              <WhatsAppIcon size={16} /> Abrir Chat
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function GroupChat({ group, allContacts, templates, onGroupUpdated, onGroupDeleted }: { group: WhatsAppGroup, allContacts: WhatsAppContact[], templates: WhatsAppTemplate[], onGroupUpdated: (g: WhatsAppGroup) => void, onGroupDeleted: (id: string) => void }) {
  const [fullGroup, setFullGroup] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [showMembersModal, setShowMembersModal] = useState(false)
  
  // Cargar contactos del grupo al montarse o cambiar
  useMemo(() => {
    setIsLoading(true)
    getGroupWithContactsAction(group.id).then(res => {
      setFullGroup(res)
      setIsLoading(false)
    })
  }, [group.id])

  const handleCopyAll = async () => {
    if (!fullGroup) return
    const lines = fullGroup.contacts.map((c: any) =>
      `${c.nombre}: ${buildWaLink(c.telefono, replacePlaceholders(msg, { nombre: c.nombre.split(' ')[0] }))}`
    ).join('\n')
    try { await navigator.clipboard.writeText(lines); alert('Links copiados al portapapeles!') } catch {}
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[#0f0f0f]/80">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: (group.color || '#25d366') + '40', border: `1px solid ${group.color || '#25d366'}80` }}>
            <Users size={24} style={{ color: group.color || '#25d366' }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{group.nombre}</h3>
            <p className="text-sm text-[var(--text-muted)] cursor-pointer hover:text-white transition-colors" onClick={() => setShowMembersModal(true)}>
              {group.contact_count ?? 0} destinatarios (Editar)
            </p>
          </div>
        </div>
        <button onClick={() => deleteGroupAction(group.id).then(() => onGroupDeleted(group.id))} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar Grupo">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
        {/* Redactor Grupal */}
        <div className="bg-white/5 border border-[var(--border-subtle)] rounded-xl p-4">
           <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Mensaje Masivo</label>
           <textarea
             value={msg}
             onChange={e => setMsg(e.target.value)}
             placeholder="Escribí el mensaje para el grupo (soporta {{nombre}})..."
             rows={3}
             className="w-full bg-black/20 border border-[var(--border-subtle)] rounded-lg p-3 text-white text-sm outline-none focus:border-[#25d366]/50 resize-none"
           />
           <div className="mt-3 flex justify-end">
             <button onClick={handleCopyAll} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors">
               <Copy size={14} /> Copiar Todos los Links
             </button>
           </div>
        </div>

        {/* Lista de Miembros del Grupo */}
        <div>
          <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Miembros del grupo</h4>
          {isLoading ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-[var(--text-muted)]" /></div>
          ) : !fullGroup?.contacts?.length ? (
            <p className="text-sm text-[var(--text-muted)]">El grupo está vacío. Haz clic en "destinatarios" arriba para añadir miembros.</p>
          ) : (
            <div className="space-y-1.5">
              {fullGroup.contacts.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-[var(--border-subtle)]">
                  <div>
                    <p className="text-sm font-semibold text-white">{c.nombre}</p>
                    <p className="text-xs font-mono text-[var(--text-muted)]">+{normalizeArgentinaPhone(c.telefono)}</p>
                  </div>
                  <a
                    href={buildWaLink(c.telefono, replacePlaceholders(msg, { nombre: c.nombre.split(' ')[0] }))}
                    target="_blank" rel="noopener noreferrer"
                    className="p-2 bg-[#25d366]/10 text-[#25d366] hover:bg-[#25d366]/20 rounded-lg transition-colors"
                  >
                    <WhatsAppIcon size={16} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Edición de Miembros */}
      {showMembersModal && (
        <GroupMembersModal
          group={group}
          currentMembers={fullGroup?.contacts ?? []}
          allContacts={allContacts}
          onClose={() => setShowMembersModal(false)}
          onSaved={(newContacts) => {
            setFullGroup({ ...fullGroup, contacts: newContacts })
            onGroupUpdated({ ...group, contact_count: newContacts.length })
            setShowMembersModal(false)
          }}
        />
      )}
    </div>
  )
}

function GroupMembersModal({ group, currentMembers, allContacts, onClose, onSaved }: { group: WhatsAppGroup, currentMembers: any[], allContacts: WhatsAppContact[], onClose: () => void, onSaved: (c: any[]) => void }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(currentMembers.map(c => c.id)))
  const [isPending, startTransition] = useTransition()

  const toggle = (id: string) => {
    const next = new Set(selectedIds)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelectedIds(next)
  }

  const save = () => {
    startTransition(async () => {
      const arr = Array.from(selectedIds)
      const res = await setGroupContactsAction(group.id, arr)
      if (res.success) {
        onSaved(allContacts.filter(c => selectedIds.has(c.id)))
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass border border-[var(--border-subtle)] rounded-2xl w-full max-w-md p-6 relative flex flex-col max-h-[80vh]">
        <h3 className="text-xl font-bold text-white mb-2">Editar miembros</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">{group.nombre}</p>
        
        <div className="flex-1 overflow-y-auto space-y-1 mb-4 custom-scrollbar">
          {allContacts.map(c => (
            <label key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
              <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggle(c.id)} className="w-4 h-4 accent-[#25d366]" />
              <div>
                <p className="text-sm text-white">{c.nombre}</p>
                <p className="text-xs text-[var(--text-muted)] font-mono">{c.telefono}</p>
              </div>
            </label>
          ))}
          {allContacts.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] text-center py-4">No hay contactos externos en la agenda.</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-white">Cancelar</button>
          <button onClick={save} disabled={isPending} className="px-4 py-2 bg-[#25d366] text-black font-bold text-sm rounded-lg hover:bg-[#1fae53]">
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void, onCreated: (g: WhatsAppGroup) => void }) {
  const [nombre, setNombre] = useState('')
  const [isPending, startTransition] = useTransition()

  const save = () => {
    if (!nombre.trim()) return
    startTransition(async () => {
      const res = await saveGroupAction({ nombre, descripcion: '', color: '#3b82f6' })
      if (res.success) {
        onCreated({ id: res.id!, nombre, descripcion: '', color: '#3b82f6', contact_count: 0, creado_por: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass border border-[var(--border-subtle)] rounded-2xl w-full max-w-sm p-6 relative">
        <h3 className="text-xl font-bold text-white mb-4">Nuevo Grupo</h3>
        <input
          autoFocus
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="Ej: Alumnos 2026..."
          className="w-full bg-black/20 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#25d366]/50 mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-white">Cancelar</button>
          <button onClick={save} disabled={isPending || !nombre.trim()} className="px-4 py-2 bg-[#25d366] text-black font-bold text-sm rounded-lg hover:bg-[#1fae53] disabled:opacity-50">
            {isPending ? 'Guardando...' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}
