import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PresentationClient } from './PresentationClient'

export const metadata: Metadata = {
  title: 'Pantalla de Resultados — ITEC',
}

export default async function PresentationPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: poll, error } = await supabase
    .from('polls')
    .select(`
      id,
      question,
      is_active,
      poll_options ( 
        id, 
        text,
        poll_votes ( id, option_id )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !poll) {
    redirect('/dashboard/encuestas')
  }

  const allVotes = poll.poll_options.flatMap((opt: any) => opt.poll_votes || [])
  const formattedPoll = {
    ...poll,
    poll_votes: allVotes
  }

  return <PresentationClient initialPoll={formattedPoll as any} />
}
