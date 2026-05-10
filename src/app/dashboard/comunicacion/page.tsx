import type { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import { ComunicacionTabs } from '@/components/comunicacion/ComunicacionTabs'
import { getAllArticles } from '@/services/news'

export const metadata: Metadata = {
  title: 'Generador de Artículos — ITEC',
}

export default async function ComunicacionPage() {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') redirect('/dashboard')

  const articles = await getAllArticles()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tight">Comunicación Estratégica</h1>
        <p className="text-[var(--text-muted)] text-lg mt-2">Gestioná la voz y el impacto institucional de ITEC</p>
      </div>

      <ComunicacionTabs member={member} articles={articles} />
    </div>
  )
}
