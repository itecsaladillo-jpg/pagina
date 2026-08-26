import type { Metadata, Viewport } from 'next'
import { createClient } from '@/lib/supabase/server'
import { VotingClient } from './VotingClient'

export const metadata: Metadata = {
  title: 'Votar — Encuestas ITEC',
}

// ago 2026: viewport migrado a su export propio (el campo dentro de Metadata
// está deprecado desde Next 14 y Next 16 ya no lo aplica)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default async function VotarPage() {
  const supabase = await createClient()

  // Buscar si hay alguna encuesta activa
  const { data: poll } = await supabase
    .from('polls')
    .select(`
      id,
      name,
      poll_questions ( 
        id, 
        text,
        poll_options ( id, text )
      )
    `)
    .eq('is_active', true)
    .single()

  return <VotingClient poll={poll || null} />
}
