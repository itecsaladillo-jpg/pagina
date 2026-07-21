import type { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import { ComunicacionTabs } from '@/components/comunicacion/ComunicacionTabs'
import { NotasMulticanalList } from '@/components/comunicacion/NotasMulticanalList'
import { getAllArticles, getAllMulticanalNewsFlashes } from '@/services/news'
import { getPublicActions } from '@/services/actions'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Comunicación — ITEC',
}

export default async function ComunicacionPage() {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') redirect('/dashboard')

  const articles = await getAllArticles()
  const actions = await getPublicActions()
  const multicanalNotas = await getAllMulticanalNewsFlashes()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tight">Comunicación Estratégica</h1>
        <p className="text-[var(--text-muted)] text-lg mt-2">Gestioná la voz institucional de ITEC</p>
      </div>

      <ComunicacionTabs 
        member={member} 
        articles={articles} 
        actions={actions}
      />

      <NotasMulticanalList notas={multicanalNotas} />
    </div>
  )
}
