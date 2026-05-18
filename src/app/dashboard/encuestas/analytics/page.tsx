import { Metadata } from 'next'
import { getCurrentMember, isAdmin } from '@/services/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnalyticsClient } from './AnalyticsClient'

export const metadata: Metadata = {
  title: 'Analíticas de Encuestas — ITEC',
}

export default async function EncuestasAnalyticsPage() {
  const member = await getCurrentMember()
  if (!member || !isAdmin(member)) redirect('/dashboard')

  const supabase = await createClient()

  const { data: polls } = await supabase
    .from('polls')
    .select(`
      id,
      question,
      created_at,
      poll_options ( 
        id, 
        text,
        poll_votes ( id )
      )
    `)
    .order('created_at', { ascending: false })

  return <AnalyticsClient initialPolls={polls || []} />
}
