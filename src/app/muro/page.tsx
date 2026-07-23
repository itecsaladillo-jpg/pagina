import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { NewsWallMulticanal } from '@/components/comunicacion/NewsWallMulticanal'
import { getAllMulticanalNewsFlashes } from '@/services/news'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Muro — ITEC',
  description: 'Novedades y comunicaciones del Instituto',
}

export default async function MuroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const allFlashes = await getAllMulticanalNewsFlashes()

  const publicFlashes = allFlashes.filter(f => 
    (f.para_publico || Boolean(f.texto_publico?.trim())) && f.is_published !== false
  )
  const memberFlashes = allFlashes.filter(f => 
    (f.para_miembros || Boolean(f.texto_miembros?.trim())) && f.is_published !== false
  )

  const sponsorFlashes = user ? allFlashes.filter(f => 
    (f.para_sponsors || Boolean(f.texto_sponsors?.trim())) && f.is_published !== false
  ) : null

  const pressFlashes = user ? allFlashes.filter(f => 
    (f.para_medios || Boolean(f.texto_medios?.trim())) && f.is_published !== false
  ) : null

  return (
    <main className='min-h-screen bg-[#020617] pt-32 pb-20 px-6'>
      <div className='max-w-4xl mx-auto space-y-16'>
        <div className='text-center space-y-6'>
          <h1 className='text-4xl md:text-5xl font-bold text-white'>
            Muro de Noticias
          </h1>
          <p className='text-white/60 max-w-2xl mx-auto'>
            Contenido público y novedades del ecosistema ITEC
          </p>
        </div>

        <NewsWallMulticanal
          publicFlashes={publicFlashes}
          memberFlashes={memberFlashes}
          sponsorFlashes={sponsorFlashes}
          pressFlashes={pressFlashes}
        />
      </div>
    </main>
  )
}