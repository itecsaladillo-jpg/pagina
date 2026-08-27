'use client'

import { useState, useMemo, useCallback, useTransition } from 'react'
import type { WhatsAppTemplate, WhatsAppContact, WhatsAppGroup } from '@/app/dashboard/whatsapp/actions'
import { logWhatsAppSendAction } from '@/app/dashboard/whatsapp/actions'
import { WhatsAppLinkGenerator, WhatsAppIcon, ITEC_WHATSAPP_NUMBER, buildWaLink, normalizeArgentinaPhone } from './WhatsAppLinkGenerator'
import { TemplateEditor } from './TemplateEditor'
import { ContactImporter } from './ContactImporter'
import { ContactGroupManager } from './ContactGroupManager'
import { Search, Phone, ChevronDown, Send, Copy, Users, FileUp, FolderHeart } from 'lucide-react'

// ─── Tipos ──────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────

const TABS = [
  { id: 'contacto',   label: 'Contacto Directo', icon: <Phone size={15} /> },
  { id: 'plantillas', label: 'Plantillas',         icon: <Send size={15} /> },
  { id: 'masivo',     label: 'Envío Masivo',        icon: <Users size={15} /> },
  { id: 'contactos',  label: 'Contactos',           icon: <FileUp size={15} /> },
  { id: 'grupos',     label: 'Grupos',              icon: <FolderHeart size={15} /> },
]

function replacePlaceholders(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

// ─── Panel principal ─────────────────────────────────────────

export function WhatsAppPanel({ members, templates, contactsData = [], groupsData = [] }: Props) {
  const [activeTab, setActiveTab] = useState<'contacto' | 'plantillas' | 'masivo' | 'contactos' | 'grupos'>('contacto')
  const [contacts, setContacts] = useState(contactsData)
  const [groups, setGroups] = useState(groupsData)

  return (
    <div className="space-y-6">
      {/* Número institucional */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#25d366]/5 border border-[#25d366]/15">
        <div className="w-10 h-10 rounded-xl bg-[#25d366]/15 flex items-center justify-center text-[#25d366]">
          <WhatsAppIcon size={22} />
        </div>
        <div className="flex-1">
          <p className="text-white text-sm font-bold">Línea institucional ITEC</p>
          <p className="text-[#25d366] font-mono text-sm">+54 9 2344 547030</p>
        </div>
        <a
          href={buildWaLink(ITEC_WHATSAPP_NUMBER)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#25d366]/70 hover:text-[#25d366] underline underline-offset-2 transition-colors"
        >
          Abrir chat propio →
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/3 border border-[var(--border-subtle)] overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-[#25d366]/15 text-[#25d366] border border-[#25d366]/25'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'contacto' && (
        <TabContacto members={members} templates={templates} />
      )}
      {activeTab === 'plantillas' && (
        <TabPlantillas templates={templates} />
      )}
      {activeTab === 'masivo' && (
        <TabMasivo members={members} templates={templates} />
      )}
      {activeTab === 'contactos' && (
        <ContactImporter contacts={contacts} onContactsChanged={setContacts} />
      )}
      {activeTab === 'grupos' && (
        <ContactGroupManager groups={groups} contacts={contacts} templates={templates} onGroupsChanged={setGroups} />
      )}
    </div>
  )
}

// ─── Tab: Contacto Directo ────────────────────────────────────

function TabContacto({ members, templates }: Props) {
  const [search, setSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<MemberContact | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null)
  const [customText, setCustomText] = useState('')
  const [, startTransition] = useTransition()

  const filtered = useMemo(() =>
    members.filter(m =>
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    ),
    [members, search]
  )

  const messageText = useMemo(() => {
    if (customText.trim()) return customText.trim()
    if (selectedTemplate && selectedMember) {
      return replacePlaceholders(selectedTemplate.cuerpo, { nombre: selectedMember.full_name.split(' ')[0] })
    }
    return ''
  }, [customText, selectedTemplate, selectedMember])

  const handleOpen = useCallback(() => {
    if (!selectedMember) return
    startTransition(async () => {
      await logWhatsAppSendAction({
        destinatario_numero: selectedMember.phone,
        destinatario_nombre: selectedMember.full_name,
        template_id: selectedTemplate?.id,
        mensaje_enviado: messageText || '(sin texto)',
      })
    })
  }, [selectedMember, selectedTemplate, messageText, startTransition])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Selector de miembro */}
      <div className="space-y-3">
        <h3 className="text-white text-sm font-bold">1. Seleccioná el destinatario</h3>

        {/* Búsqueda */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar miembro por nombre o email…"
            className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl pl-9 pr-3 py-2.5 text-white text-sm placeholder:text-[var(--text-muted)]/50 focus:border-[var(--accent-primary)] outline-none transition-all"
          />
        </div>

        {/* Lista de miembros */}
        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
          {filtered.length === 0 ? (
            <p className="text-center text-[var(--text-muted)] text-sm py-6">
              {members.length === 0
                ? 'No hay miembros con teléfono registrado.'
                : 'Sin resultados para esa búsqueda.'}
            </p>
          ) : (
            filtered.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMember(m)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  selectedMember?.id === m.id
                    ? 'bg-[#25d366]/10 border border-[#25d366]/25 text-[#25d366]'
                    : 'hover:bg-white/5 border border-transparent text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold shrink-0">
                  {m.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.full_name}</p>
                  <p className="text-xs text-[var(--text-muted)] font-mono truncate">{m.phone}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Mensaje y link */}
      <div className="space-y-4">
        <h3 className="text-white text-sm font-bold">2. Configurá el mensaje</h3>

        {/* Selector de plantilla */}
        {templates.length > 0 && (
          <div className="relative">
            <select
              value={selectedTemplate?.id ?? ''}
              onChange={e => {
                const t = templates.find(t => t.id === e.target.value) ?? null
                setSelectedTemplate(t)
                setCustomText('')
              }}
              className="w-full appearance-none bg-white/5 border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-white text-sm focus:border-[var(--accent-primary)] outline-none transition-all pr-8 cursor-pointer"
            >
              <option value="" className="bg-[#0f0f0f]">— Usar plantilla (opcional) —</option>
              {templates.map(t => (
                <option key={t.id} value={t.id} className="bg-[#0f0f0f]">{t.titulo}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
        )}

        {/* Texto personalizado */}
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">
            Mensaje personalizado {selectedTemplate ? '(reemplaza la plantilla)' : ''}
          </label>
          <textarea
            value={customText}
            onChange={e => { setCustomText(e.target.value); setSelectedTemplate(null) }}
            placeholder={
              selectedTemplate
                ? 'Dejá vacío para usar la plantilla seleccionada…'
                : 'Escribí tu mensaje aquí (opcional)…'
            }
            rows={4}
            className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-[var(--text-muted)]/50 focus:border-[var(--accent-primary)] outline-none transition-all resize-none"
          />
        </div>

        {/* Preview del mensaje */}
        {messageText && selectedMember && (
          <div className="p-3 rounded-xl bg-[#25d366]/5 border border-[#25d366]/15">
            <p className="text-[10px] text-[#25d366]/70 font-bold uppercase tracking-wider mb-1.5">Vista previa del mensaje</p>
            <p className="text-white text-xs whitespace-pre-wrap font-mono leading-relaxed">{messageText}</p>
          </div>
        )}

        {/* Link de WhatsApp */}
        {selectedMember ? (
          <div className="pt-1">
            <WhatsAppLinkGenerator
              phone={selectedMember.phone}
              recipientName={selectedMember.full_name}
              text={messageText || undefined}
              showNormalized
              onOpen={handleOpen}
            />
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-[var(--border-subtle)] text-center text-[var(--text-muted)] text-sm">
            Seleccioná un miembro para generar el link
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Plantillas ─────────────────────────────────────────

function TabPlantillas({ templates }: { templates: WhatsAppTemplate[] }) {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-white font-bold text-sm mb-1">Plantillas de mensajes</h3>
        <p className="text-[var(--text-muted)] text-xs">
          Creá mensajes reutilizables con variables dinámicas como <code className="text-[#25d366] font-mono">{'{{nombre}}'}</code>.
        </p>
      </div>
      <TemplateEditor templates={templates} />
    </div>
  )
}

// ─── Tab: Envío Masivo ────────────────────────────────────────

function TabMasivo({ members, templates }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null)
  const [customText, setCustomText] = useState('')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [filterSearch, setFilterSearch] = useState('')

  const filteredMembers = useMemo(() =>
    members.filter(m =>
      m.full_name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      m.phone.includes(filterSearch)
    ),
    [members, filterSearch]
  )

  const getMessageFor = useCallback((m: MemberContact): string => {
    const base = customText.trim() || selectedTemplate?.cuerpo || ''
    return replacePlaceholders(base, { nombre: m.full_name.split(' ')[0], email: m.email })
  }, [customText, selectedTemplate])

  const handleCopyAll = useCallback(async () => {
    const links = filteredMembers
      .map(m => `${m.full_name}: ${buildWaLink(m.phone, getMessageFor(m))}`)
      .join('\n')
    try {
      await navigator.clipboard.writeText(links)
    } catch {
      const el = document.createElement('textarea')
      el.value = links
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
  }, [filteredMembers, getMessageFor])

  const handleCopyOne = useCallback(async (idx: number, link: string) => {
    try { await navigator.clipboard.writeText(link) } catch { /* ignore */ }
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }, [])

  const membersWithPhone = members.length
  const membersWithoutPhone = 0 // ya filtrados al cargar

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-white font-bold text-sm mb-1">Envío masivo por WhatsApp</h3>
        <p className="text-[var(--text-muted)] text-xs">
          Genera un link personalizado para cada miembro con teléfono registrado ({membersWithPhone} contactos).
          Copiá los links individualmente o todos juntos.
        </p>
      </div>

      {/* Selección de mensaje */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="relative">
          <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">Plantilla</label>
          <select
            value={selectedTemplate?.id ?? ''}
            onChange={e => {
              const t = templates.find(t => t.id === e.target.value) ?? null
              setSelectedTemplate(t)
              setCustomText('')
            }}
            className="w-full appearance-none bg-white/5 border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-white text-sm focus:border-[var(--accent-primary)] outline-none transition-all pr-8"
          >
            <option value="" className="bg-[#0f0f0f]">— Sin plantilla —</option>
            {templates.map(t => (
              <option key={t.id} value={t.id} className="bg-[#0f0f0f]">{t.titulo}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-3 bottom-3 text-[var(--text-muted)] pointer-events-none" />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">O escribí un mensaje personalizado</label>
          <textarea
            value={customText}
            onChange={e => { setCustomText(e.target.value); setSelectedTemplate(null) }}
            placeholder="Mensaje para todos (soporta {{nombre}})…"
            rows={2}
            className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-white text-sm placeholder:text-[var(--text-muted)]/50 focus:border-[var(--accent-primary)] outline-none transition-all resize-none"
          />
        </div>
      </div>

      {/* Filtro de búsqueda */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
            placeholder="Filtrar contactos…"
            className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl pl-9 pr-3 py-2 text-white text-sm placeholder:text-[var(--text-muted)]/50 focus:border-[var(--accent-primary)] outline-none transition-all"
          />
        </div>
        <button
          type="button"
          onClick={handleCopyAll}
          disabled={filteredMembers.length === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[var(--text-muted)] hover:text-white text-sm font-medium transition-all disabled:opacity-30"
        >
          <Copy size={13} />
          Copiar todos
        </button>
      </div>

      {/* Lista de links generados */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-10 text-[var(--text-muted)] text-sm border border-dashed border-[var(--border-subtle)] rounded-2xl">
          No hay miembros con teléfono registrado.
        </div>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {filteredMembers.map((m, idx) => {
            const msg = getMessageFor(m)
            const link = buildWaLink(m.phone, msg || undefined)
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/3 border border-[var(--border-subtle)]/60 hover:border-[var(--border-subtle)] transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] shrink-0">
                  {m.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{m.full_name}</p>
                  <p className="text-[var(--text-muted)] text-xs font-mono truncate">
                    +{normalizeArgentinaPhone(m.phone)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#25d366]/10 hover:bg-[#25d366]/20 border border-[#25d366]/20 hover:border-[#25d366]/40 text-[#25d366] text-xs font-medium transition-all"
                  >
                    <WhatsAppIcon size={12} />
                    Abrir
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyOne(idx, link)}
                    className={`p-1.5 rounded-lg border text-xs font-medium transition-all ${
                      copiedIdx === idx
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'hover:bg-white/10 border-transparent text-[var(--text-muted)] hover:text-white'
                    }`}
                    title="Copiar link"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-[var(--text-muted)] text-[11px]">
        💡 <strong>Tip:</strong> Los links abren WhatsApp Web con el mensaje pre-cargado. Al hacer clic en "Abrir" se inicia una conversación directa con ese contacto desde tu WhatsApp.
      </p>
    </div>
  )
}
