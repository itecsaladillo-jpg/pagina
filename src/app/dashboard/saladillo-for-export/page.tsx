import { redirect } from 'next/navigation'
import { getCurrentMember } from '@/services/auth'
import { createClient } from '@/lib/supabase/server'
import { SaladilloForExportClient } from './SaladilloForExportClient'

export default async function SaladilloForExportPage() {
  const member = await getCurrentMember()
  if (!member || member.status !== 'activo') redirect('/acceso-pendiente')

  const supabase = await createClient()
  const { data: testimonios } = await supabase
    .from('saladillo_for_export')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Saladillo for Export</h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Testimonios de saladillenses en el mundo. Aprobá, gestioná embajadores y eliminá registros.
        </p>
      </div>
      <SaladilloForExportClient testimonios={testimonios || []} />
    </div>
  )
}
