import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WhatsAppDashboard } from '@/components/whatsapp/WhatsAppDashboard'
import type { WhatsAppContact, WhatsAppTemplate } from './types'
import type { WhatsAppGroupWithCount } from './types'

export const metadata = { title: 'WhatsApp Masivo — ITEC Saladillo' }

export default async function WhatsAppPage() {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const [contactsRes, groupsRes, templatesRes] = await Promise.all([
    supabase.from('whatsapp_contacts').select('*').order('nombre'),
    supabase
      .from('whatsapp_groups')
      .select('*, whatsapp_group_contacts(count)')
      .order('nombre_grupo'),
    supabase.from('whatsapp_templates').select('*').order('created_at', { ascending: false }),
  ])

  const contacts = (contactsRes.data ?? []) as WhatsAppContact[]
  const groups = ((groupsRes.data ?? []) as (WhatsAppGroupWithCount & {
    whatsapp_group_contacts?: { count: number }[]
  })[]).map((g) => ({
    ...g,
    contact_count: g.whatsapp_group_contacts?.[0]?.count ?? 0,
    whatsapp_group_contacts: undefined,
  }))
  const templates = (templatesRes.data ?? []) as WhatsAppTemplate[]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <WhatsAppIcon className="text-[#25d366]" />
          WhatsApp Masivo
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Gestión de grupos, contactos, plantillas y envío masivo vía WhatsApp Web.
        </p>
      </div>
      <WhatsAppDashboard contacts={contacts} groups={groups} templates={templates} />
    </div>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.406A9.944 9.944 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 0 1-4.333-1.279l-.31-.184-3.118.88.846-3.048-.201-.313A7.954 7.954 0 0 1 4 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z" />
    </svg>
  )
}
