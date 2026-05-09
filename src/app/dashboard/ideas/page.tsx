import type { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Buzón de Ideas — ITEC',
}

export default async function IdeasPage() {
  const member = await getCurrentMember()
  if (!member || member.status !== 'activo') redirect('/acceso-pendiente')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Buzón de Ideas</h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Propuestas para mejorar el ITEC. Tu opinión nos ayuda a crecer.
        </p>
      </div>

      <div className="glass border border-[var(--border-subtle)] rounded-2xl p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className="text-white font-semibold mb-2">Buzón en mantenimiento</h3>
        <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto">
          Estamos rediseñando el sistema de votación de ideas. Volvé pronto para dejar tu propuesta.
        </p>
      </div>
    </div>
  )
}
