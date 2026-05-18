import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './SettingsForm'
import { Cog } from 'lucide-react'

export default async function SettingsPage() {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('site_settings')
    .select('*')
    .single()

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Cog className="text-[var(--accent-primary-2)]" size={32} />
          Ajustes del Sitio
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Administrá la identidad visual y las credenciales de integración del ITEC.
        </p>
      </div>

      <div className="glass border border-[var(--border-subtle)] rounded-2xl p-8">
        <SettingsForm settings={settings || {}} />
      </div>
    </div>
  )
}
