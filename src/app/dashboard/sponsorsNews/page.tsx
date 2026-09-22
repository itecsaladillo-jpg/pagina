'use client'

import { useState, useEffect } from 'react'
import { NewsWallMulticanal } from '@/components/comunicacion/NewsWallMulticanal'
import { SponsorForm } from '@/app/dashboard/sponsors/SponsorForm'

export default function SponsorsNewsPage() {
  const [sponsorFlashes, setSponsorFlashes] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)

  const loadSponsorFlashes = () => {
    fetch('/api/sponsors-news')
      .then(r => r.json())
      .then(d => setSponsorFlashes(d))
      .catch(() => {})
  }

  useEffect(() => {
    loadSponsorFlashes()
  }, [])

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Muro Sponsors</h1>
          <p className="text-white/60 text-sm">
            Noticias y reportes para sponsors del ecosistema ITEC
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary text-xs py-2 px-6 rounded-xl"
        >
          + Nuevo Socio
        </button>
      </div>

      <NewsWallMulticanal
        publicFlashes={[]}
        memberFlashes={null}
        sponsorFlashes={sponsorFlashes}
        pressFlashes={null}
        hideTabs
        defaultTab="sponsors"
      />

      {showForm && (
        <SponsorForm sponsor={null} onClose={() => { setShowForm(false); loadSponsorFlashes() }} />
      )}
    </div>
  )
}