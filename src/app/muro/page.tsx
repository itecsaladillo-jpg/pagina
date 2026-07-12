import type { Metadata } from 'next'
import { getPublicNewsFlashes, getMemberNewsFlashes } from '@/services/news'
import { NewsWallMulticanal } from '@/components/comunicacion/NewsWallMulticanal'

export const metadata: Metadata = {
  title: 'Muro — ITEC',
  description: 'Novedades y comunicaciones del Instituto',
}

export default async function MuroPage() {
  const publicFlashes = await getPublicNewsFlashes()
  const memberFlashes = await getMemberNewsFlashes()

  return (
    <main className='min-h-screen bg-[#020617] pt-32 pb-20 px-6'>
      <div className='max-w-4xl mx-auto space-y-16'>
        <div className='text-center space-y-6'>
          <h1 className='text-4xl md:text-5xl font-bold text-white'>
            Muro de Noticias
          </h1>
          <p className='text-white/60 max-w-2xl mx-auto'>
            Contenido publico y comentarios internos del ecosistema ITEC
          </p>
        </div>

        <NewsWallMulticanal
          publicFlashes={publicFlashes}
          memberFlashes={memberFlashes}
        />
      </div>
    </main>
  )
}