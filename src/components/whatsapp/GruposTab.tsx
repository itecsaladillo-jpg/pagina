'use client'

import { useState, useEffect, useTransition } from 'react'
import type { WhatsAppTemplate, WhatsAppGroup, WhatsAppContact } from '@/app/dashboard/whatsapp/actions'
import { saveGroupAction, deleteGroupAction, getGroupWithContactsAction, setGroupContactsAction } from '@/app/dashboard/whatsapp/actions'
import { buildWaLink, normalizeArgentinaPhone } from './WhatsAppLinkGenerator'
import { ConfirmDialog } from './ConfirmDialog'
import { useToast } from './Toast'
import { Search, Users, Plus, X, Loader2, ChevronLeft, Check, ExternalLink, Copy, Pencil } from 'lucide-react'

type UnifiedContact = {
  id: string
  nombre: string
  telefono: string
  email: string | null
  tipo: 'miembro' | WhatsAppContact['fuente']
}

interface Props {
  groupsData: WhatsAppGroup[]
  allContacts: UnifiedContact[]
  templates: WhatsAppTemplate[]
  onGroupCreated: (g: WhatsAppGroup) => void
  onGroupUpdated: (g: WhatsAppGroup) => void
  onGroupDeleted: (id: string) => void
}

export function GruposTab({ groupsData, allContacts, templates, onGroupCreated, onGroupUpdated, onGroupDeleted }: Props) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [showWizard, setShowWizard] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<WhatsAppGroup | null>(null)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const selectedGroup = groupsData.find(g => g.id === selectedGroupId) ?? null

  return (
    <div className="flex flex-col h-full">
      {selectedGroup ? (
        <GroupDetail
          group={selectedGroup}
          allContacts={allContacts}
          templates={templates}
          onBack={() => setSelectedGroupId(null)}
          onGroupUpdated={onGroupUpdated}
          onDelete={() => { setDeleteTarget(selectedGroup); setSelectedGroupId(null) }}
          toast={toast}
        />
      ) : showWizard ? (
        <CreateGroupWizard
          allContacts={allContacts}
          onCreated={(g) => { onGroupCreated(g); setShowWizard(false); setSelectedGroupId(g.id) }}
          onCancel={() => setShowWizard(false)}
          isPending={isPending}
          startTransition={startTransition}
          toast={toast}
        />
      ) : (
        <>
          {/* Header */}
          <div className="p-4 border-b border-[var(--border-subtle)] bg-[#0f0f0f]/80 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold flex items-center gap-2">
                <Users size={18} className="text-[#25d366]" /> Grupos
                <span className="text-xs text-[var(--text-muted)] font-normal ml-1">({groupsData.length})</span>
              </h2>
              <button
                onClick={() => setShowWizard(true)}
                className="px-3 py-1.5 text-xs font-bold text-black bg-[#25d366] hover:bg-[#1fae53] rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Plus size={13} /> Nuevo Grupo
              </button>
            </div>
          </div>

          {/* Lista de grupos */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {groupsData.length === 0 ? (
              <div className="text-center py-10 text-[var(--text-muted)] text-sm">
                No hay grupos. Creá uno para empezar.
              </div>
            ) : (
              groupsData.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroupId(g.id)}
                  className="w-full text-left px-3 py-3 rounded-xl flex items-center gap-3 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: (g.color || '#25d366') + '20', border: `1px solid ${g.color || '#25d366'}40` }}
                  >
                    <Users size={18} style={{ color: g.color || '#25d366' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{g.nombre}</p>
                    <p className="text-xs text-[var(--text-muted)]">{g.contact_count ?? 0} miembros</p>
                  </div>
                  <ExternalLink size={14} className="text-[var(--text-muted)] shrink-0" />
                </button>
              ))
            )}
          </div>
        </>
      )}

      {/* Confirmación de eliminación */}
      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar grupo"
          message={`¿Seguro que querés eliminar el grupo "${deleteTarget.nombre}"? Se desasociarán todos sus miembros.`}
          confirmLabel="Eliminar"
          variant="danger"
          isPending={isPending}
          onConfirm={() => {
            startTransition(async () => {
              const res = await deleteGroupAction(deleteTarget.id)
              if (res.success) {
                onGroupDeleted(deleteTarget.id)
                setDeleteTarget(null)
                toast('success', 'Grupo eliminado.')
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

// ─── Wizard de Creación de Grupo (2 pasos) ───────────────────

function CreateGroupWizard({ allContacts, onCreated, onCancel, isPending, startTransition, toast }: {
  allContacts: UnifiedContact[]
  onCreated: (g: WhatsAppGroup) => void
  onCancel: () => void
  isPending: boolean
  startTransition: React.TransitionStartFunction
  toast: (type: 'success' | 'error' | 'info', msg: string) => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [color, setColor] = useState('#25d366')
  const [selectedPhones, setSelectedPhones] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  const toggle = (phone: string) => {
    const next = new Set(selectedPhones)
    next.has(phone) ? next.delete(phone) : next.add(phone)
    setSelectedPhones(next)
  }

  const filteredContacts = allContacts.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) || c.telefono.includes(search)
  )

  const handleCreate = () => {
    startTransition(async () => {
      const res = await saveGroupAction({ nombre, descripcion, color })
      if (res.success) {
        const newGroup: WhatsAppGroup = {
          id: res.id!, nombre, descripcion: descripcion || null, color,
          contact_count: selectedPhones.size, creado_por: null,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        }

        // Asignar contactos si hay seleccionados
        if (selectedPhones.size > 0) {
          const contactsToSync = allContacts.filter(c => selectedPhones.has(c.telefono))
          await setGroupContactsAction(res.id!, contactsToSync as any)
        }

        onCreated(newGroup)
        toast('success', 'Grupo creado.')
      } else {
        toast('error', res.error ?? 'Error al crear grupo.')
      }
    })
  }

  const PRESET_COLORS = ['#25d366', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16']

  return (
    <div className="flex flex-col h-full">
      {/* Header del wizard */}
      <div className="p-4 border-b border-[var(--border-subtle)] bg-[#0f0f0f]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {step === 2 && (
            <button onClick={() => setStep(1)} className="text-[var(--text-muted)] hover:text-white">
              <ChevronLeft size={20} />
            </button>
          )}
          <div>
            <h2 className="text-white font-bold">
              {step === 1 ? 'Nuevo Grupo' : 'Agregar Miembros'}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Paso {step} de 2 {step === 2 && `· ${selectedPhones.size} seleccionados`}
            </p>
          </div>
        </div>
        {/* Indicador de pasos */}
        <div className="flex gap-2 mt-3">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-[#25d366]' : 'bg-white/10'}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-[#25d366]' : 'bg-white/10'}`} />
        </div>
      </div>

      {step === 1 ? (
        /* ── Paso 1: Datos del grupo ── */
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Nombre *</label>
            <input
              autoFocus
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Alumnos 2026"
              className="w-full bg-black/40 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#25d366]"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Descripción (opcional)</label>
            <input
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Ej: Grupo de alumnos del taller"
              className="w-full bg-black/40 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#25d366]"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f0f0f] scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="pt-4 flex gap-2">
            <button onClick={onCancel} className="px-4 py-2.5 text-sm text-[var(--text-muted)] hover:text-white transition-colors">
              Cancelar
            </button>
            <button
              onClick={() => nombre.trim() && setStep(2)}
              disabled={!nombre.trim()}
              className="flex-1 px-4 py-2.5 bg-[#25d366] text-black font-bold text-sm rounded-xl hover:bg-[#1fae53] disabled:opacity-50 transition-colors"
            >
              Siguiente: Agregar Miembros
            </button>
          </div>
        </div>
      ) : (
        /* ── Paso 2: Seleccionar miembros ── */
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-3 border-b border-[var(--border-subtle)]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar contactos..."
                className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl pl-9 pr-3 py-2 text-white text-sm placeholder:text-[var(--text-muted)] focus:border-[#25d366]/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredContacts.map(c => (
              <label
                key={c.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/10 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedPhones.has(c.telefono)}
                  onChange={() => toggle(c.telefono)}
                  className="w-4 h-4 accent-[#25d366] rounded cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{c.nombre}</p>
                  <p className="text-xs text-[var(--text-muted)] font-mono">{c.telefono}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.tipo === 'miembro' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400'}`}>
                  {c.tipo}
                </span>
              </label>
            ))}
            {filteredContacts.length === 0 && (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">No se encontraron contactos.</p>
            )}
          </div>

          <div className="p-3 border-t border-[var(--border-subtle)] flex gap-2">
            <button onClick={onCancel} className="px-4 py-2.5 text-sm text-[var(--text-muted)] hover:text-white transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={isPending}
              className="flex-1 px-4 py-2.5 bg-[#25d366] text-black font-bold text-sm rounded-xl hover:bg-[#1fae53] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {isPending ? 'Creando...' : `Crear Grupo (${selectedPhones.size} miembros)`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Detalle de Grupo ────────────────────────────────────────

function GroupDetail({ group, allContacts, templates, onBack, onGroupUpdated, onDelete, toast }: {
  group: WhatsAppGroup
  allContacts: UnifiedContact[]
  templates: WhatsAppTemplate[]
  onBack: () => void
  onGroupUpdated: (g: WhatsAppGroup) => void
  onDelete: () => void
  toast: (type: 'success' | 'error' | 'info', msg: string) => void
}) {
  const [fullGroup, setFullGroup] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [showMembers, setShowMembers] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [groupName, setGroupName] = useState(group.nombre)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setIsLoading(true)
    getGroupWithContactsAction(group.id).then(res => {
      setFullGroup(res)
      setIsLoading(false)
    })
  }, [group.id])

  const handleCopyAll = async () => {
    if (!fullGroup?.contacts?.length) return
    const lines = fullGroup.contacts.map((c: any) =>
      `${c.nombre}: ${buildWaLink(c.telefono, replacePlaceholders(msg, { nombre: c.nombre.split(' ')[0] }))}`
    ).join('\n')
    try {
      await navigator.clipboard.writeText(lines)
      toast('success', 'Links copiados al portapapeles.')
    } catch {
      toast('error', 'No se pudieron copiar los links.')
    }
  }

  const handleSaveName = () => {
    if (!groupName.trim() || groupName === group.nombre) { setEditingName(false); return }
    startTransition(async () => {
      const res = await saveGroupAction({ id: group.id, nombre: groupName })
      if (res.success) {
        onGroupUpdated({ ...group, nombre: groupName })
        setEditingName(false)
        toast('success', 'Nombre actualizado.')
      } else {
        toast('error', res.error ?? 'Error al actualizar.')
        setGroupName(group.nombre)
      }
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-subtle)] bg-[#0f0f0f]/80 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-[var(--text-muted)] hover:text-white transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: (group.color || '#25d366') + '20', border: `1px solid ${group.color || '#25d366'}40` }}
            >
              <Users size={18} style={{ color: group.color || '#25d366' }} />
            </div>
            <div>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setGroupName(group.nombre); setEditingName(false) } }}
                    className="bg-black/40 border border-[#25d366] rounded-lg px-2 py-1 text-white text-sm font-bold outline-none w-48"
                  />
                </div>
              ) : (
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {group.nombre}
                  <button onClick={() => setEditingName(true)} className="text-[var(--text-muted)] hover:text-white">
                    <Pencil size={14} />
                  </button>
                </h3>
              )}
              <p className="text-sm text-[var(--text-muted)]">{fullGroup?.contacts?.length ?? group.contact_count ?? 0} destinatarios</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMembers(true)} className="px-3 py-1.5 text-xs font-bold text-black bg-[#25d366] hover:bg-[#1fae53] rounded-lg transition-colors flex items-center gap-1.5">
              <Plus size={13} /> Asignar
            </button>
            <button onClick={onDelete} className="px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20">
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
        {/* Redactor */}
        <div className="bg-white/5 border border-[var(--border-subtle)] rounded-xl p-4">
          <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Mensaje Masivo</label>
          <textarea
            value={msg}
            onChange={e => setMsg(e.target.value)}
            placeholder="Escribí el mensaje para el grupo (soporta {{nombre}})..."
            rows={3}
            className="w-full bg-black/40 border border-[var(--border-subtle)] rounded-lg p-3 text-white text-sm custom-scrollbar mb-3 focus:outline-none focus:border-[#25d366]"
          />
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
            {templates.map(t => (
              <button key={t.id} onClick={() => setMsg(t.cuerpo)} className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-white border border-white/10 transition-colors">
                {t.titulo}
              </button>
            ))}
            {templates.length === 0 && (
              <span className="text-xs text-[var(--text-muted)]">No hay plantillas disponibles</span>
            )}
          </div>
        </div>

        {/* Destinatarios */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Destinatarios ({fullGroup?.contacts?.length || 0})</label>
            <button onClick={handleCopyAll} disabled={!msg.trim() || !fullGroup?.contacts?.length} className="text-[#25d366] text-xs font-bold hover:underline disabled:opacity-50 flex items-center gap-1">
              <Copy size={12} /> Copiar todos
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[var(--text-muted)]" size={24} /></div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {fullGroup?.contacts?.map((c: any) => {
                const link = buildWaLink(c.telefono, replacePlaceholders(msg, { nombre: c.nombre.split(' ')[0] }))
                return (
                  <a key={c.id} href={link} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors group">
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{c.nombre}</p>
                      <p className="text-xs text-[var(--text-muted)] font-mono">{c.telefono}</p>
                    </div>
                    <ExternalLink size={14} className="text-[var(--text-muted)] group-hover:text-[#25d366] shrink-0" />
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de miembros */}
      {showMembers && (
        <GroupMembersModal
          group={group}
          currentMembers={fullGroup?.contacts ?? []}
          allContacts={allContacts}
          onClose={() => setShowMembers(false)}
          onSaved={(newContacts) => {
            setFullGroup({ ...fullGroup, contacts: newContacts })
            onGroupUpdated({ ...group, contact_count: newContacts.length })
            setShowMembers(false)
          }}
        />
      )}
    </div>
  )
}

function replacePlaceholders(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

// ─── Modal de Asignación de Miembros ─────────────────────────

function GroupMembersModal({ group, currentMembers, allContacts, onClose, onSaved }: {
  group: WhatsAppGroup
  currentMembers: any[]
  allContacts: UnifiedContact[]
  onClose: () => void
  onSaved: (c: any[]) => void
}) {
  const [selectedPhones, setSelectedPhones] = useState<Set<string>>(new Set(currentMembers.map(c => c.telefono)))
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  const toggle = (phone: string) => {
    const next = new Set(selectedPhones)
    next.has(phone) ? next.delete(phone) : next.add(phone)
    setSelectedPhones(next)
  }

  const save = () => {
    startTransition(async () => {
      const contactsToSync = allContacts.filter(c => selectedPhones.has(c.telefono))
      const res = await setGroupContactsAction(group.id, contactsToSync as any)
      if (res.success) {
        onSaved(contactsToSync)
        toast('success', 'Miembros actualizados.')
      } else {
        toast('error', res.error ?? 'Error al guardar.')
      }
    })
  }

  const filteredContacts = allContacts.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || c.telefono.includes(searchTerm)
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass border border-[var(--border-subtle)] rounded-2xl w-full max-w-md p-6 relative flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-white mb-1">Editar miembros</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">{group.nombre}</p>

        <input
          type="text"
          placeholder="Buscar contactos..."
          className="w-full bg-black/40 border border-[var(--border-subtle)] rounded-lg p-2 text-white text-sm mb-4 focus:outline-none focus:border-[#25d366]"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

        <div className="flex-1 overflow-y-auto space-y-1 mb-4 custom-scrollbar">
          {filteredContacts.map(c => (
            <label key={c.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={selectedPhones.has(c.telefono)} onChange={() => toggle(c.telefono)} className="w-4 h-4 accent-[#25d366] rounded cursor-pointer" />
                <div>
                  <p className="text-sm text-white font-medium">{c.nombre}</p>
                  <p className="text-xs text-[var(--text-muted)] font-mono">{c.telefono}</p>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.tipo === 'miembro' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400'}`}>
                {c.tipo}
              </span>
            </label>
          ))}
          {filteredContacts.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] text-center py-4">No se encontraron contactos.</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors">Cancelar</button>
          <button onClick={save} disabled={isPending} className="px-4 py-2 bg-[#25d366] text-black font-bold text-sm rounded-lg hover:bg-[#1fae53] disabled:opacity-50 flex items-center gap-2">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {isPending ? 'Guardando...' : `Guardar (${selectedPhones.size})`}
          </button>
        </div>
      </div>
    </div>
  )
}
