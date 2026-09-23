'use client'

import { useState, useEffect } from 'react'
import {
  createGroupAction,
  updateGroupAction,
  deleteGroupAction,
  getGroupsAction,
  createContactAction,
  getContactsByGroupAction,
  generateWhatsAppInvitationsAction,
} from './actions'
import { WhatsAppGroup, WhatsAppContact } from '@/types/database'
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  MessageCircle,
  Copy,
  ExternalLink,
  Send,
  Check,
  Phone,
  User,
  X,
  RefreshCw,
} from 'lucide-react'

// ─────────────────────────────────────────
// GROUP CARD
// ─────────────────────────────────────────

function GroupCard({
  group,
  contacts,
  onSelect,
  onDelete,
}: {
  group: WhatsAppGroup
  contacts: WhatsAppContact[]
  onSelect: () => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(group.nombre)

  const handleSave = async () => {
    if (!name.trim()) return
    await updateGroupAction(group.id, { nombre: name.trim() })
    setEditing(false)
  }

  return (
    <div
      className="glass border border-[var(--border-subtle)] rounded-xl p-4 hover:border-violet-500/30 transition-all cursor-pointer group/card"
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        {editing ? (
          <div className="flex-1 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field text-sm bg-black/40"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button onClick={handleSave} className="btn-primary px-3 py-1.5 text-xs">
              <Check size={14} />
            </button>
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
        ) : (
          <h3 className="text-white font-bold text-sm">{group.nombre}</h3>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(true) }}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Edit2 size={14} className="text-[var(--text-muted)]" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} className="text-red-400" />
          </button>
        </div>
      </div>
      {group.descripcion && (
        <p className="text-[var(--text-muted)] text-xs mb-2">{group.descripcion}</p>
      )}
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Users size={13} />
        <span>{contacts.length} contacto{contacts.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// CONTACT FORM
// ─────────────────────────────────────────

function ContactForm({
  groupId,
  onAdded,
  onClose,
}: {
  groupId: string
  onAdded: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    notas: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre || !form.telefono) {
      setError('Nombre y teléfono son requeridos')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await createContactAction({ ...form, grupo_id: groupId })
      setForm({ nombre: '', apellido: '', telefono: '', notas: '' })
      onAdded()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1.5 ml-1">
            Nombre *
          </label>
          <input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full input-field text-sm"
            placeholder="Juan"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1.5 ml-1">
            Apellido
          </label>
          <input
            value={form.apellido}
            onChange={(e) => setForm({ ...form, apellido: e.target.value })}
            className="w-full input-field text-sm"
            placeholder="Pérez"
          />
        </div>
      </div>
      <div>
        <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1.5 ml-1">
          Teléfono *
        </label>
        <div className="relative">
          <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            className="w-full input-field text-sm pl-9"
            placeholder="2344-123456"
          />
        </div>
      </div>
      <div>
        <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1.5 ml-1">
          Notas
        </label>
        <textarea
          value={form.notas}
          onChange={(e) => setForm({ ...form, notas: e.target.value })}
            className="w-full input-field text-sm resize-none h-16"
            placeholder="Agrega notas opcionales..."
        />
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className="btn-primary flex-1 text-xs py-2">
          {submitting ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <>
              <Plus size={14} />
              Agregar contacto
            </>
          )}
        </button>
        <button type="button" onClick={onClose} className="px-3 py-2 text-xs text-[var(--text-muted)] hover:text-white transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ─────────────────────────────────────────
// INVITE MODAL
// ─────────────────────────────────────────

function InviteModal({
  group,
  contacts,
  onClose,
}: {
  group: WhatsAppGroup
  contacts: WhatsAppContact[]
  onClose: () => void
}) {
  const [type, setType] = useState<'sponsor' | 'training'>('training')
  const [title, setTitle] = useState('')
  const [linkId, setLinkId] = useState('')
  const [sending, setSending] = useState(false)
  interface Invitation {
    contactId: string
    contactName: string
    phone: string
    whatsappUrl: string
  }
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const commonMessage = `Estimado/a, te invitamos a participar de nuestra próxima actividad en ITEC Saladillo. Más información disponible al hacer clic en el enlace.`

  const handleGenerate = async () => {
    if (!title.trim() || !linkId.trim()) return
    setSending(true)
    try {
      const res = await generateWhatsAppInvitationsAction({
        grupoId: group.id,
        type,
        title: title.trim(),
        linkId: linkId.trim(),
      })
      if (res.invitations) {
        setInvitations(res.invitations)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      alert(message)
    }
    setSending(false)
  }

  const copyCommonMessage = async () => {
    await navigator.clipboard.writeText(commonMessage)
    setCopiedId('common')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <MessageCircle className="text-green-400" />
              Invitar a {group.nombre}
            </h2>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              {contacts.length} contactos · {type === 'sponsor' ? 'Sponsors' : 'Capacitación'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <X size={20} className="text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Type selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setType('training')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              type === 'training'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'bg-white/5 text-[var(--text-muted)] hover:text-white'
            }`}
          >
            Capacitación
          </button>
          <button
            onClick={() => setType('sponsor')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              type === 'sponsor'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-white/5 text-[var(--text-muted)] hover:text-white'
            }`}
          >
            Reporte Sponsor
          </button>
        </div>

        {/* Form inputs */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1.5 ml-1">
              {type === 'training' ? 'Título de la capacitación' : 'Título del reporte'}
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full input-field text-sm"
              placeholder={type === 'training' ? 'Ej: Robótica Básica 2026' : 'Ej: Reporte de Impacto Q2 2026'}
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1.5 ml-1">
              ID del enlace (slug)
            </label>
            <input
              value={linkId}
              onChange={(e) => setLinkId(e.target.value)}
              className="w-full input-field text-sm"
              placeholder={type === 'training' ? 'abc123' : 'xyz789'}
            />
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={sending || !title.trim() || !linkId.trim()}
          className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 mb-4"
        >
          {sending ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <>
              <Send size={16} />
              Generar invitaciones para {contacts.length} contactos
            </>
          )}
        </button>

        {/* Common message (copyable) */}
        {invitations.length > 0 && (
          <div className="mb-4 p-4 bg-white/5 rounded-xl border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-[var(--text-muted)] tracking-widest">
                Mensaje común (copiar para grupos existentes)
              </span>
              <button
                onClick={copyCommonMessage}
                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                {copiedId === 'common' ? (
                  <>
                    <Check size={12} /> Copiado
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copiar
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{commonMessage}</p>
          </div>
        )}

        {/* Invitations list */}
        {invitations.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase text-[var(--text-muted)] tracking-widest mb-3">
              Invitaciones generadas ({invitations.length})
            </h4>
            <div className="space-y-2">
              {invitations.map((inv) => (
                <div
                  key={inv.contactId}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-[var(--border-subtle)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <MessageCircle size={14} className="text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{inv.contactName}</p>
                      <p className="text-[var(--text-muted)] text-xs">{inv.phone}</p>
                    </div>
                  </div>
                  <a
                    href={inv.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
                  >
                    Abrir
                    <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>
            <p className="text-[var(--text-muted)] text-xs mt-3 text-center">
              Cada enlace abrirá WhatsApp Web con el mensaje pre-formateado. Abre todas las pestañas para enviar.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────

export function WhatsAppManagementClient() {
  const [groups, setGroups] = useState<WhatsAppGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<WhatsAppGroup | null>(null)
  const [contacts, setContacts] = useState<WhatsAppContact[]>([])
  const [showContactForm, setShowContactForm] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newGroupName, setNewGroupName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const res = await getGroupsAction()
      if (mounted && res.success && res.groups) {
        setGroups(res.groups)
      }
      if (mounted) {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const loadContacts = async (groupId: string) => {
    const res = await getContactsByGroupAction(groupId)
    if (res.success && res.contacts) {
      setContacts(res.contacts)
    }
  }

  const handleSelectGroup = async (group: WhatsAppGroup) => {
    setSelectedGroup(group)
    await loadContacts(group.id)
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    setCreating(true)
    try {
      const res = await createGroupAction({ nombre: newGroupName.trim() })
      if (res.data) {
        setGroups([...groups, res.data])
        setSelectedGroup(res.data)
        setNewGroupName('')
        await loadContacts(res.data.id)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      alert(message)
    }
    setCreating(false)
  }

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('¿Eliminar este grupo y todos sus contactos?')) return
    await deleteGroupAction(id)
    setGroups(groups.filter((g) => g.id !== id))
    if (selectedGroup?.id === id) {
      setSelectedGroup(null)
      setContacts([])
    }
  }

  const handleAddContact = () => {
    loadContacts(selectedGroup?.id || '')
    setShowContactForm(false)
  }

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <MessageCircle className="text-green-400" size={32} />
          WhatsApp — Gestión de Invitaciones
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Gestioná grupos de contactos para enviar invitaciones a capacitaciones y reportes de sponsors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Groups */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Users size={16} className="text-violet-400" />
              Grupos
            </h2>
            <span className="text-[var(--text-muted)] text-xs">{groups.length}</span>
          </div>

          {/* Create group */}
          <div className="glass border border-[var(--border-subtle)] rounded-xl p-4">
            <div className="flex gap-2">
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                className="flex-1 input-field text-sm"
                placeholder="Nuevo grupo..."
              />
                <button
                  onClick={handleCreateGroup}
                  disabled={creating || !newGroupName.trim()}
                  className="btn-primary px-3 py-2 text-xs"
                >
                  <Plus size={16} />
                </button>
            </div>
          </div>

          {/* Groups list */}
          <div className="space-y-2">
            {loading ? (
              <p className="text-[var(--text-muted)] text-sm">Cargando...</p>
            ) : groups.length === 0 ? (
              <p className="text-[var(--text-muted)] text-sm text-center py-8">
                No hay grupos creados. Creá uno nuevo arriba.
              </p>
            ) : (
              groups.map((group) => (
                <div key={group.id}>
                  <GroupCard
                    group={group}
                    contacts={contacts.filter((c) => c.grupo_id === group.id)}
                    onSelect={() => handleSelectGroup(group)}
                    onDelete={() => handleDeleteGroup(group.id)}
                  />
                  {selectedGroup?.id === group.id && (
                    <div className="ml-2 mt-1 pl-3 border-l-2 border-violet-500/30">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowInviteModal(true)
                        }}
                        className="mt-2 w-full btn-primary py-2 text-xs flex items-center justify-center gap-2"
                      >
                        <MessageCircle size={14} />
                        Invitar al grupo
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Contacts */}
        <div className="lg:col-span-2 space-y-4">
          {selectedGroup ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                  <User size={16} className="text-green-400" />
                  Contactos: {selectedGroup.nombre}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
                  >
                    <Send size={14} />
                    Invitar grupo
                  </button>
                  <button
                    onClick={() => setShowContactForm(!showContactForm)}
                    className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
                  >
                    <Plus size={14} />
                    Agregar contacto
                  </button>
                </div>
              </div>

              {showContactForm && (
                <div className="glass border border-[var(--border-subtle)] rounded-xl p-4">
                  <ContactForm
                    groupId={selectedGroup.id}
                    onAdded={handleAddContact}
                    onClose={() => setShowContactForm(false)}
                  />
                </div>
              )}

              <div className="space-y-2">
                {contacts.length === 0 ? (
                  <p className="text-[var(--text-muted)] text-sm text-center py-8">
                    No hay contactos en este grupo. Agregá el primero.
                  </p>
                ) : (
                  contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-[var(--border-subtle)] hover:border-green-500/20 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <User size={14} className="text-green-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium">
                            {contact.nombre} {contact.apellido}
                          </p>
                          <p className="text-[var(--text-muted)] text-xs">{contact.telefono}</p>
                          {contact.notas && (
                            <p className="text-[var(--text-muted)] text-xs italic mt-0.5">{contact.notas}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="glass border border-[var(--border-subtle)] rounded-xl p-12 text-center">
              <Users size={48} className="text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
              <p className="text-[var(--text-muted)] text-sm">
               Seleccioná un grupo para ver los contactos
              </p>
              <p className="text-[var(--text-muted)] text-xs mt-1">
                O creá un nuevo grupo desde la lista izquierda
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && selectedGroup && (
        <InviteModal
          group={selectedGroup}
          contacts={contacts}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  )
}
