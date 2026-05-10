import type { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import { ArticleEditor } from '@/components/comunicacion/ArticleEditor'

export const metadata: Metadata = {
  title: 'Generador de Artículos — ITEC',
}

export default async function ComunicacionPage() {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Comunicación Estratégica</h1>
        <p className="text-[var(--text-muted)] text-sm">Transformá hechos en historias inspiradoras para la comunidad</p>
      </div>

      <ArticleEditor member={member} />
    </div>
  )
}
