import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getActionById } from '@/services/actions'
import { ActionDetailClient } from './ActionDetailClient'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const action = await getActionById(params.id)
  if (!action) return { title: 'Acción no encontrada' }
  return { title: `${action.title} — ITEC Saladillo` }
}

export default async function AccionDetailPage({ params }: Props) {
  const action = await getActionById(params.id)
  if (!action) notFound()

  return (
    <main className="min-h-screen bg-[#020617] pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto space-y-12">
        <ActionDetailClient action={JSON.parse(JSON.stringify(action))} />
      </div>
    </main>
  )
}
