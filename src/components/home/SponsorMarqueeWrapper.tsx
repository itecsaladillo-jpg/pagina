'use client'

import dynamic from 'next/dynamic'

const SponsorHeaderBar = dynamic(
  () => import('./SponsorHeaderBar').then(mod => mod.SponsorHeaderBar),
  { ssr: false }
)

export function SponsorMarqueeWrapper() {
  return <SponsorHeaderBar />
}
