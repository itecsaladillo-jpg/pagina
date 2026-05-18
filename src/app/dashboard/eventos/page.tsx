import { Metadata } from 'next'
import { getCurrentMember, isAdmin } from '@/services/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import EventListClient from './EventListClient'

export const metadata: Metadata = {
  title: 'Sistema de Preguntas — ITEC',
}

export default async function SistemaPreguntasDashboard() {
  const member = await getCurrentMember()
  if (!member || !isAdmin(member)) redirect('/dashboard')

  const supabase = await createClient()

  // Traemos las acciones/eventos de ITEC
  const { data: actions, error } = await supabase
    .from('itec_actions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching actions:', error)
  }

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
          <MessageSquare className="text-indigo-400" size={32} />
          Sistema de Preguntas al Orador
        </h1>
        <p className="text-zinc-400 text-sm max-w-3xl leading-relaxed">
          Administrá las interacciones de tu audiencia en vivo. Seleccioná un evento para moderar las preguntas entrantes, proyectar el ranking dinámico en pantalla gigante o compartir el link del asistente.
        </p>
      </div>

      <EventListClient initialActions={actions || []} />
    </div>
  )
}
