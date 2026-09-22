import type { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { IdeasManagementClient } from './IdeasManagementClient'

export const metadata: Metadata = {
  title: 'Buzón de Ideas — ITEC',
}

export default async function IdeasPage() {
  const member = await getCurrentMember()
  if (!member || member.status !== 'activo') redirect('/acceso-pendiente')

  const supabase = await createClient()
  const { data: ideas } = await supabase
    .from('ideas')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Buzón de Ideas</h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Propuestas de la comunidad. Revisá, gestioná y dales seguimiento.
        </p>
      </div>

      <IdeasManagementClient ideas={ideas || []} isAdmin={member.role === 'admin'} />
    </div>
  )
}
