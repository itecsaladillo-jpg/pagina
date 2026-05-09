import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import { SponsorsAdmin } from './SponsorsAdmin'

export default async function SponsorsAdminPage() {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  const [{ data: sponsors }, { data: acciones }] = await Promise.all([
    supabase.from('sponsors').select('*').order('created_at', { ascending: false }),
    supabase.from('acciones_itec').select('*').order('fecha', { ascending: false }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Sponsors & Impacto</h1>
        <p className="text-[var(--text-secondary)] text-sm max-w-xl">
          Gestioná los socios estratégicos, registrá las acciones del período y generá reportes de trascendencia personalizados para cada aliado.
        </p>
      </div>

      <SponsorsAdmin
        initialSponsors={sponsors || []}
        initialAcciones={acciones || []}
      />
    </div>
  )
}
