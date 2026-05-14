import type { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import VideotecaManager from './VideotecaManager'
import { videoService } from '@/services/videos'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Gestión de Videoteca — ITEC',
}

export default async function VideotecaAdminPage() {
  const member = await getCurrentMember()
  if (!member || member.status !== 'activo' || !['admin', 'coordinador'].includes(member.role)) {
    redirect('/dashboard')
  }

  let initialVideos = []
  try {
    const supabase = await createClient()
    initialVideos = await videoService.getAllVideos(supabase)
  } catch (error) {
    console.error('Error al cargar videos:', error)
  }


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Gestión de Videoteca</h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Añadí y administrá los videos que se muestran en la sección pública del ITEC.
        </p>
      </div>

      <VideotecaManager initialVideos={initialVideos} />
    </div>
  )
}
