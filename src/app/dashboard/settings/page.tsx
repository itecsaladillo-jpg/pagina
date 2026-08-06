import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSettingsAction } from './actions'
import { SettingsForm } from './SettingsForm'
import { ApiKeysSettingsForm } from './ApiKeysSettingsForm'
import { Cog, Key } from 'lucide-react'

export default async function SettingsPage() {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const [{ data: settings }, apiSettings] = await Promise.all([
    supabase.from('site_settings').select('*').single(),
    getSettingsAction()
  ])

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Cog className="text-[var(--accent-primary-2)]" size={32} />
          Ajustes del Sitio
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Administrá la identidad visual y las credenciales de integración de ITEC.
        </p>
      </div>

      <div className="glass border border-[var(--border-subtle)] rounded-2xl p-8">
        <SettingsForm settings={settings || {}} />
      </div>

      <div className="glass border border-[var(--border-subtle)] rounded-2xl p-8">
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4 mb-6">
          <Key size={18} className="text-[var(--accent-primary-2)]" />
          <h2 className="text-white font-bold text-lg">API Keys y Proveedores</h2>
        </div>
        <p className="text-[var(--text-muted)] text-xs mb-6">
          Gestioná las credenciales de servicios externos. Los valores se guardan en la base de datos y tienen prioridad sobre las variables de entorno.
        </p>
        <ApiKeysSettingsForm settings={apiSettings} />
      </div>
    </div>
  )
}
