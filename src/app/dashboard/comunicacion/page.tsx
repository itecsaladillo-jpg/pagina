import type { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import { ComunicacionTabs } from '@/components/comunicacion/ComunicacionTabs'
import { getAllArticles, getNewsFlashes } from '@/services/news'
import { getPublicActions } from '@/services/actions'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Generador de Artículos — ITEC',
}

export default async function ComunicacionPage() {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') redirect('/dashboard')

  const articles = await getAllArticles()
  const flashes = await getNewsFlashes()
  const actions = await getPublicActions()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tight">Comunicación Estratégica</h1>
        <p className="text-[var(--text-muted)] text-lg mt-2">Gestioná la voz y el impacto institucional de ITEC</p>
        
        {/* Debug Info */}
        <div className="mt-4 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-400 font-mono">
          SERVER_FETCH_DEBUG: Articulos: {articles.length} | Flashes: {flashes.length} | Acciones: {actions.length}
        </div>
      </div>

      <ComunicacionTabs 
        member={member} 
        articles={articles} 
        flashes={flashes} 
        actions={actions}
      />
    </div>
  )
}
