import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') redirect('/dashboard')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Ajustes del Sitio</h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Personalizá la apariencia global y la información de contacto del ITEC.
        </p>
      </div>

      <div className="glass border border-[var(--border-subtle)] rounded-2xl p-8">
        <p className="text-white italic text-sm">
          Módulo en desarrollo. Próximamente podrás editar los textos de la Landing Page directamente desde aquí.
        </p>
      </div>
    </div>
  )
}
