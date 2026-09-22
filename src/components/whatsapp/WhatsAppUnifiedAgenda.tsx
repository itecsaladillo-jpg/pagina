'use client'

import { useState, useMemo } from 'react'
import type { WhatsAppTemplate, WhatsAppContact, WhatsAppGroup } from '@/app/dashboard/whatsapp/actions'
import { ContactosTab } from './ContactosTab'
import { GruposTab } from './GruposTab'
import { PlantillasTab } from './PlantillasTab'
import { PlantillaSidebar } from './PlantillaSidebar'
import { ToastProvider } from './Toast'
import { WhatsAppIcon, ITEC_WHATSAPP_NUMBER } from './WhatsAppLinkGenerator'
import { Users, MessageSquare, FileText } from 'lucide-react'

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

type Tab = 'contactos' | 'grupos' | 'plantillas'

export function WhatsAppUnifiedAgenda({ members, templates: initialTemplates, contactsData = [], groupsData = [] }: Props) {
  return (
    <ToastProvider>
      <WhatsAppAgendaInner
        members={members}
        templates={initialTemplates}
        contactsData={contactsData}
        groupsData={groupsData}
      />
    </ToastProvider>
  )
}

function WhatsAppAgendaInner({ members, templates: initialTemplates, contactsData = [], groupsData = [] }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('contactos')
  const [contacts, setContacts] = useState<WhatsAppContact[]>(contactsData)
  const [groups, setGroups] = useState<WhatsAppGroup[]>(groupsData)
  const [templates] = useState<WhatsAppTemplate[]>(initialTemplates)

  // Stats
  const memberCount = useMemo(() => members.length, [members])
  const contactCount = contacts.length
  const groupCount = groups.length
  const templateCount = templates.length

  // Handlers para contactos
  const handleContactCreated = (c: WhatsAppContact) => setContacts(prev => [...prev, c])
  const handleContactUpdated = (c: { id: string; nombre: string; telefono: string; email: string | null }) => {
    setContacts(prev => prev.map(x => x.id === c.id ? { ...x, nombre: c.nombre, telefono: c.telefono, email: c.email } : x))
  }
  const handleContactDeleted = (id: string) => setContacts(prev => prev.filter(x => x.id !== id))
  const handleImport = async (parsed: { nombre: string; telefono: string; email?: string }[], source: string) => {
    const { saveContactsBulkAction } = await import('@/app/dashboard/whatsapp/actions')
    const res = await saveContactsBulkAction(parsed, source as any)
    if (res.success && res.contacts.length > 0) {
      setContacts(prev => {
        const currentPhones = new Set(prev.map(c => c.telefono))
        const newContacts = res.contacts.filter(c => !currentPhones.has(c.telefono))
        return [...prev, ...newContacts]
      })
    }
    return res
  }

  // Handlers para grupos
  const handleGroupCreated = (g: WhatsAppGroup) => setGroups(prev => [...prev, g])
  const handleGroupUpdated = (g: WhatsAppGroup) => setGroups(prev => prev.map(x => x.id === g.id ? g : x))
  const handleGroupDeleted = (id: string) => setGroups(prev => prev.filter(x => x.id !== id))

  // Contactos unificados para GruposTab
  const allContacts = useMemo(() => {
    const arr: { id: string; nombre: string; telefono: string; email: string | null; tipo: 'miembro' | WhatsAppContact['fuente'] }[] = []
    members.forEach(m => arr.push({ id: m.id, nombre: m.full_name, telefono: m.phone, email: m.email, tipo: 'miembro' }))
    contacts.forEach(c => arr.push({ id: c.id, nombre: c.nombre, telefono: c.telefono, email: c.email, tipo: c.fuente }))
    return arr.sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [members, contacts])

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'contactos', label: 'Contactos', icon: <Users size={15} />, count: memberCount + contactCount },
    { key: 'grupos', label: 'Grupos', icon: <MessageSquare size={15} />, count: groupCount },
    { key: 'plantillas', label: 'Plantillas', icon: <FileText size={15} />, count: templateCount },
  ]

  return (
    <div className="flex flex-col h-full min-h-[600px] animate-fade-in">
      {/* Header */}
      <div className="glass border border-[var(--border-subtle)] rounded-t-2xl p-4 bg-[#0f0f0f]/80 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <WhatsAppIcon size={24} className="text-[#25d366]" /> WhatsApp
          </h1>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-[#25d366] animate-pulse"></span>
            <span className="font-mono text-white">+{ITEC_WHATSAPP_NUMBER}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-[var(--border-subtle)] text-center">
            <p className="text-lg font-bold text-white">{memberCount + contactCount}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Contactos</p>
          </div>
          <div className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-[var(--border-subtle)] text-center">
            <p className="text-lg font-bold text-white">{groupCount}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Grupos</p>
          </div>
          <div className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-[var(--border-subtle)] text-center">
            <p className="text-lg font-bold text-white">{templateCount}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Plantillas</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-[#25d366]/15 text-[#25d366] border border-[#25d366]/30 shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === tab.key ? 'bg-[#25d366]/20 text-[#25d366]' : 'bg-white/10 text-[var(--text-muted)]'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido de tabs */}
      <div className="flex-1 glass border border-[var(--border-subtle)] border-t-0 rounded-b-2xl overflow-hidden">
        {activeTab === 'contactos' && (
          <ContactosTab
            members={members}
            contactsData={contacts}
            onContactCreated={handleContactCreated}
            onContactUpdated={handleContactUpdated}
            onContactDeleted={handleContactDeleted}
            onImport={handleImport}
          />
        )}
        {activeTab === 'grupos' && (
          <GruposTab
            groupsData={groups}
            allContacts={allContacts}
            templates={templates}
            onGroupCreated={handleGroupCreated}
            onGroupUpdated={handleGroupUpdated}
            onGroupDeleted={handleGroupDeleted}
          />
        )}
        {activeTab === 'plantillas' && (
          <PlantillasTab initialTemplates={templates} />
        )}
      </div>

      {/* Sidebar de plantillas (accesible desde cualquier tab) */}
      <PlantillaSidebar
        templates={templates}
        onManageClick={() => setActiveTab('plantillas')}
      />
    </div>
  )
}
