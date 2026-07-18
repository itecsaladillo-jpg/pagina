import type { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AIProcessorForm } from './AIProcessorForm'

export const metadata: Metadata = {
  title: 'Procesador IA — ITEC',
}

export default async function AIPage() {
  const member = await getCurrentMember()
  if (!member || member.status !== 'activo') redirect('/acceso-pendiente')
  if (!['admin', 'coordinador'].includes(member.role)) redirect('/dashboard')

  const supabase = await createClient()
  const { data: commissions } = await supabase
    .from('commissions')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Procesador IA</h1>
        </div>
        <p className="text-[var(--text-secondary)] text-sm">
          Pegá una transcripción de reunión o descripción de capacitación y Gemini generará 
          automáticamente el resumen, las tareas pendientes y el flash para el muro.
        </p>
      </div>

      <div className="glass border border-[var(--border-subtle)] rounded-xl p-6">
        <AIProcessorForm commissions={commissions ?? []} />
      </div>
    </div>
  )
}
