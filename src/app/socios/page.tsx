import type { Metadata } from 'next'
import { NuestrosSociosSection } from '@/components/home/NuestrosSociosSection'
import { getSociosData } from '@/lib/data/socios'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Nuestros Socios — ITEC',
  description:
    'Sponsors, alianzas estratégicas y canales de difusión que hacen posible el ITEC Augusto Cicaré de Saladillo.',
}

export default async function SociosPage() {
  const { sponsors, alianzas, canalesDifusion } = await getSociosData()

  return (
    <main className="min-h-screen bg-[#020617] pt-32 pb-20 px-6">
      <NuestrosSociosSection
        sponsors={sponsors}
        alianzas={alianzas}
        canalesDifusion={canalesDifusion}
      />
    </main>
  )
}
