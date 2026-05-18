import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { VotingClient } from './VotingClient'

export const metadata: Metadata = {
  title: 'Votar — Encuestas ITEC',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default async function VotarPage() {
  const supabase = await createClient()

  // Buscar si hay alguna encuesta activa
  const { data: poll } = await supabase
    .from('polls')
    .select(`
      id,
      question,
      poll_options ( id, text )
    `)
    .eq('is_active', true)
    .single()

  return <VotingClient poll={poll || null} />
}
