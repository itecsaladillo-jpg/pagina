import { redirect } from 'next/navigation'
import { getCurrentMember } from '@/services/auth'
import { createClient } from '@/lib/supabase/server'
import { ArchivoClient } from './ArchivoClient'
import type { ArchivoAccion } from '@/types/database'
import { HISTORICAL_ACTIONS_DATA } from '@/data/historicalActions'

export const metadata = {
  title: 'Archivo Histórico — Panel de Administración | ITEC Saladillo',
}

export default async function ArchivoPage() {
  const member = await getCurrentMember()
  if (!member || member.status !== 'activo') {
    redirect('/acceso-pendiente')
  }

  if (!['admin', 'coordinador'].includes(member.role)) {
    redirect('/dashboard')
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('archivo_acciones')
    .select('*')
    .order('created_at', { ascending: false })

  let acciones: ArchivoAccion[] = (data as ArchivoAccion[]) || []

  // Si la tabla estuviese vacía inicialmente, mostramos como base los eventos documentados
  if (acciones.length === 0) {
    const fallbackList: ArchivoAccion[] = []
    for (const [yearStr, items] of Object.entries(HISTORICAL_ACTIONS_DATA)) {
      const y = Number(yearStr) as 2022 | 2023 | 2024 | 2025
      for (const item of items) {
        fallbackList.push({
          id: item.id,
          title: item.title,
          social_url: item.socialUrl,
          year: y,
          category: item.category || 'General',
          description: item.description || null,
          created_at: new Date().toISOString(),
          created_by: null,
        })
      }
    }
    acciones = fallbackList
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Archivo de Eventos y Acciones</h1>
        <p className="text-[var(--text-secondary)] text-sm max-w-3xl">
          Carga y gestión de acciones realizadas en años anteriores (2022, 2023, 2024 y 2025). 
          Cada evento cargado con su año obligatorio y enlace a redes sociales se refleja automáticamente en la sección 
          <strong className="text-white"> "ITEC EN MOVIMIENTO"</strong> de la página principal.
        </p>
      </div>

      <ArchivoClient initialAcciones={acciones} />
    </div>
  )
}
