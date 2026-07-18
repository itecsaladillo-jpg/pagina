import type { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import { NewsWallMulticanal } from '@/components/comunicacion/NewsWallMulticanal'
import { getSponsorNewsFlashes } from '@/services/news'

export const metadata: Metadata = {
  title: 'Muro Sponsors — ITEC',
}

export default async function SponsorsNewsPage() {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') redirect('/dashboard')

  const sponsorFlashes = await getSponsorNewsFlashes()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Muro Sponsors</h1>
        <p className="text-white/60 text-sm">
          Noticias y reportes para sponsors del ecosistema ITEC
        </p>
      </div>

      <NewsWallMulticanal
        publicFlashes={[]}
        memberFlashes={null}
        sponsorFlashes={sponsorFlashes}
        pressFlashes={null}
      />
    </div>
  )
}