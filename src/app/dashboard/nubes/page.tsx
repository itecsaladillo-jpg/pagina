import { Metadata } from 'next'
import { getCurrentMember, isAdmin } from '@/services/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import EventListClient from '../eventos/EventListClient'

export const metadata: Metadata = {
  title: 'Nube de Ideas — ITEC',
}

export default async function NubeIdeasDashboard() {
  const member = await getCurrentMember()
  if (!member || !isAdmin(member)) redirect('/dashboard')

  const supabase = await createClient()

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
          <Sparkles className="text-purple-400 animate-pulse" size={32} />
          Nube de Ideas
        </h1>
        <p className="text-zinc-400 text-sm max-w-3xl leading-relaxed">
          Creá y gestioná nubes de ideas para tus eventos en vivo. Cada nube tiene su propio código QR para que los participantes envíen una palabra desde su celular. Las palabras más repetidas se muestran más grandes en la pantalla gigante.
        </p>
      </div>

      <EventListClient initialActions={actions || []} mode="nubes" />
    </div>
  )
}
