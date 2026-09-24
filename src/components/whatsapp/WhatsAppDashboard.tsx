'use client'

import { useState } from 'react'
import type { WhatsAppContact, WhatsAppTemplate } from '@/app/dashboard/whatsapp/types'
import type { WhatsAppGroupWithCount } from '@/app/dashboard/whatsapp/types'
import { ToastProvider } from './shared/Toast'
import { GroupsSection } from './GroupsSection'
import { SendSection } from './SendSection'
import { TemplatesSection } from './TemplatesSection'
import { Users, Send, FileText } from 'lucide-react'

interface Props {
  contacts: WhatsAppContact[]
  groups: WhatsAppGroupWithCount[]
  templates: WhatsAppTemplate[]
}

type Tab = 'grupos' | 'envio' | 'plantillas'

export function WhatsAppDashboard(props: Props) {
  return (
    <ToastProvider>
      <WhatsAppDashboardInner {...props} />
    </ToastProvider>
  )
}

function WhatsAppDashboardInner({ contacts, groups, templates }: Props) {
  const [tab, setTab] = useState<Tab>('grupos')
  const [groupsState, setGroupsState] = useState<WhatsAppGroupWithCount[]>(groups)
  const [contactsState, setContactsState] = useState<WhatsAppContact[]>(contacts)
  const [templatesState, setTemplatesState] = useState<WhatsAppTemplate[]>(templates)

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'grupos', label: 'Grupos', icon: <Users size={15} />, count: groupsState.length },
    { key: 'envio', label: 'Envío Masivo', icon: <Send size={15} />, count: contactsState.length },
    { key: 'plantillas', label: 'Plantillas', icon: <FileText size={15} />, count: templatesState.length },
  ]

  return (
    <div className="glass border border-[var(--border-subtle)] rounded-2xl overflow-hidden animate-fade-in">
      {/* Stats */}
      <div className="p-4 bg-[#0f0f0f]/80 backdrop-blur-md border-b border-[var(--border-subtle)]">
        <div className="flex gap-2 mb-4">
          <div className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-[var(--border-subtle)] text-center">
            <p className="text-lg font-bold text-white">{contactsState.length}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Contactos</p>
          </div>
          <div className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-[var(--border-subtle)] text-center">
            <p className="text-lg font-bold text-white">{groupsState.length}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Grupos</p>
          </div>
          <div className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-[var(--border-subtle)] text-center">
            <p className="text-lg font-bold text-white">{templatesState.length}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Plantillas</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === t.key
                  ? 'bg-[#25d366]/15 text-[#25d366] border border-[#25d366]/30 shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent'
              }`}
            >
              {t.icon}
              {t.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  tab === t.key ? 'bg-[#25d366]/20 text-[#25d366]' : 'bg-white/10 text-[var(--text-muted)]'
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="min-h-[520px]">
        {tab === 'grupos' && (
          <GroupsSection
            groups={groupsState}
            contacts={contactsState}
            onGroupsChange={setGroupsState}
            onContactsChange={setContactsState}
          />
        )}
        {tab === 'envio' && <SendSection groups={groupsState} templates={templatesState} />}
        {tab === 'plantillas' && (
          <TemplatesSection templates={templatesState} onTemplatesChange={setTemplatesState} />
        )}
      </div>
    </div>
  )
}
