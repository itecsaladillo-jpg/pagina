import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentMember } from '@/services/auth'
import { getProximasActividades } from '@/services/proximasActividades'
import { ProximasActividadesAdmin } from './ProximasActividadesAdmin'
import { CalendarRange } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Próximas Actividades — Panel de Control ITEC',
  description: 'Gestión y edición de la pizarra de próximas actividades y eventos del ITEC.',
}

export const dynamic = 'force-dynamic'

export default async function ProximasActividadesPage() {
  const member = await getCurrentMember()
  if (!member) {
    redirect('/login')
  }
  if (member.role !== 'admin' && member.role !== 'coordinador') {
    redirect('/dashboard')
  }

  const actividades = await getProximasActividades()

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      <div className="border-b border-zinc-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[var(--accent-warm)]">
              <CalendarRange size={22} />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Próximas Actividades
            </h1>
          </div>
          <p className="text-zinc-400 text-sm max-w-3xl leading-relaxed">
            Administrá las actividades y eventos que se publican en la <strong>Pizarra de Próximas Actividades</strong> en la página principal, ubicada junto al lema institucional.
          </p>
        </div>
      </div>

      <ProximasActividadesAdmin initialActividades={actividades} />
    </div>
  )
}
