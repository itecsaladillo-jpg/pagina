import type { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Capacitaciones — ITEC',
}

export default async function CapacitacionesPage() {
  const member = await getCurrentMember()
  if (!member || member.status !== 'activo') redirect('/acceso-pendiente')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Capacitaciones</h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Próximos encuentros, talleres y material de formación técnica.
        </p>
      </div>

      <div className="glass border border-[var(--border-subtle)] rounded-2xl p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[var(--accent-primary-2)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-white font-semibold mb-2">Próximamente</h3>
        <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto">
          Estamos organizando el cronograma de capacitaciones para este ciclo. Pronto verás los eventos acá.
        </p>
      </div>
    </div>
  )
}
