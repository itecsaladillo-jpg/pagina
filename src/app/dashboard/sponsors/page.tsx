import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import { SponsorsList } from './SponsorsList'

export default async function SponsorsAdminPage() {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const { data: sponsors } = await supabase
    .from('sponsors')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Sponsors & Impacto</h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Gestioná los vínculos institucionales y generá reportes de transparencia para tus aliados.
        </p>
      </div>

      <SponsorsList initialSponsors={sponsors || []} />
    </div>
  )
}
