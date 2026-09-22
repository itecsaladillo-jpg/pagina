import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import { MediosAdmin } from './MediosAdmin'

export default async function PrensaPage() {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  
  const { data: medios } = await supabase
    .from('medios_prensa')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Gestión de Prensa</h1>
        <p className="text-[var(--text-secondary)] text-sm max-w-xl">
          Administrá los medios de comunicación.
        </p>
      </div>

      <MediosAdmin initialMedios={medios || []} />
    </div>
  )
}