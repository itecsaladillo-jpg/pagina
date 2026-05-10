import type { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import { ComunicacionTabs } from '@/components/comunicacion/ComunicacionTabs'
import { getAllArticles, getNewsFlashes } from '@/services/news'
import { getPublicActions } from '@/services/actions'

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
