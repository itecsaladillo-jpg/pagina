import type { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import { NewsWallMulticanal } from '@/components/comunicacion/NewsWallMulticanal'
import { getPressNewsFlashes } from '@/services/news'

export const metadata: Metadata = {
  title: 'Prensa — ITEC',
}

export default async function PressNewsPage() {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') redirect('/dashboard')

  const pressFlashes = await getPressNewsFlashes()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Prensa</h1>
        <p className="text-white/60 text-sm">
          Gacetillas y comunicados para medios de comunicación
        </p>
      </div>

      <NewsWallMulticanal
        publicFlashes={[]}
        memberFlashes={null}
        sponsorFlashes={null}
        pressFlashes={pressFlashes}
      />
    </div>
  )
}