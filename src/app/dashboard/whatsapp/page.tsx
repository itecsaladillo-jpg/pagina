import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentMember } from '@/services/auth'
import { createClient } from '@/lib/supabase/server'
import { getTemplatesAction, getContactsAction, getGroupsAction } from './actions'
import { WhatsAppPanel } from '@/components/whatsapp/WhatsAppPanel'
import { WhatsAppIcon } from '@/components/whatsapp/WhatsAppLinkGenerator'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'WhatsApp — ITEC Saladillo',
}

export default async function WhatsAppPage() {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  // Obtener miembros con teléfono registrado
  const { data: membersRaw } = await supabase
    .from('members')
    .select('id, full_name, email, phone')
    .eq('status', 'activo')
    .not('phone', 'is', null)
    .neq('phone', '')
    .order('full_name')

  const members = (membersRaw ?? []).map(m => ({
    id: m.id as string,
    full_name: m.full_name as string,
    email: m.email as string,
    phone: m.phone as string,
  }))

  const [templates, contacts, groups] = await Promise.all([
    getTemplatesAction(),
    getContactsAction(),
    getGroupsAction(),
  ])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Encabezado */}
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <span className="text-[#25d366]">
            <WhatsAppIcon size={30} />
          </span>
          WhatsApp
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Generá links de contacto, administrá plantillas y enviá mensajes a miembros, sponsors y medios.
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass border border-[var(--border-subtle)] rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-white">{members.length}</p>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">Contactos con teléfono</p>
        </div>
        <div className="glass border border-[var(--border-subtle)] rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-[#25d366]">{templates.length}</p>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">Plantillas guardadas</p>
        </div>
        <div className="glass border border-[var(--border-subtle)] rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-purple-400">wa.me</p>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">Links instantáneos</p>
        </div>
      </div>

      {/* Panel principal */}
      <div className="glass border border-[var(--border-subtle)] rounded-2xl p-6">
        <WhatsAppPanel members={members} templates={templates} contactsData={contacts} groupsData={groups} />
      </div>
    </div>
  )
}
