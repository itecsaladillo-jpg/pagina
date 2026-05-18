import { Metadata } from 'next'
import { getCurrentMember, isAdmin } from '@/services/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart2 } from 'lucide-react'
import { PollManager } from './PollManager'

export const metadata: Metadata = {
  title: 'Encuestas en Vivo — ITEC',
}

export default async function EncuestasPage() {
  const member = await getCurrentMember()
  if (!member || !isAdmin(member)) redirect('/dashboard')

  const supabase = await createClient()

  // Fetch polls con opciones y cuenta de votos
  const { data: polls, error } = await supabase
    .from('polls')
    .select(`
      id,
      question,
      is_active,
      created_at,
      poll_options ( 
        id, 
        text,
        poll_votes ( id, option_id )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching polls:', error)
  }

  // Flatten poll_votes para que PollManager reciba el formato que espera
  const formattedPolls = (polls || []).map(poll => {
    const allVotes = poll.poll_options.flatMap((opt: any) => opt.poll_votes || [])
    return {
      ...poll,
      poll_votes: allVotes
    }
  })

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <BarChart2 className="text-[var(--accent-primary-2)]" size={32} />
          Encuestas en Vivo
        </h1>
        <p className="text-[var(--text-secondary)] text-sm max-w-2xl">
          Creá y gestioná encuestas para interactuar en tiempo real durante eventos presenciales.
          Lanzá la encuesta en vivo y abrí la pantalla de resultados para proyectarla.
        </p>
      </div>

      <PollManager initialPolls={formattedPolls as any} />
    </div>
  )
}
