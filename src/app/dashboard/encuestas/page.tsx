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
      name,
      is_active,
      created_at,
      poll_questions (
        id,
        text,
        poll_options ( 
          id, 
          text,
          poll_votes ( id, option_id )
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching polls:', error)
  }

  // Flatten poll_votes para que PollManager pueda calcular totales si lo requiere,
  // y aplanar opciones para compatibilidad, aunque PollManager lo maneja de forma anidada ahora.
  // Es mejor pasar el formato anidado directo.
  const formattedPolls = polls || []

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-[var(--border-subtle)] pb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BarChart2 className="text-[var(--accent-primary-2)]" size={32} />
            Encuestas en Vivo
          </h1>
          <p className="text-[var(--text-secondary)] text-sm max-w-2xl">
            Creá y gestioná encuestas para interactuar en tiempo real durante eventos presenciales.
            Lanzá la encuesta en vivo y abrí la pantalla de resultados para proyectarla.
          </p>
        </div>
        <a 
          href="/dashboard/encuestas/analytics" 
          className="btn-outline shrink-0 flex items-center gap-2 py-2 px-4 whitespace-nowrap border-[var(--accent-primary)]/30 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition-all"
        >
          <BarChart2 size={16} />
          Analíticas Avanzadas
        </a>
      </div>

      <PollManager initialPolls={formattedPolls as any} />
    </div>
  )
}
