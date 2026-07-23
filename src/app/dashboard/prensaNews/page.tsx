'use client'

import { useState, useEffect } from 'react'
import { NewsWallMulticanal } from '@/components/comunicacion/NewsWallMulticanal'
import { MedioForm } from '@/app/dashboard/prensa/MedioForm'

export default function PressNewsPage() {
  const [pressFlashes, setPressFlashes] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)

  const loadPressFlashes = () => {
    fetch('/api/press-news')
      .then(r => r.json())
      .then(d => setPressFlashes(d))
      .catch(() => {})
  }

  useEffect(() => {
    loadPressFlashes()
  }, [])

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Prensa</h1>
          <p className="text-white/60 text-sm">
            Gacetillas y comunicados para medios de comunicación
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary text-xs py-2 px-6 rounded-xl"
        >
          + Nuevo Medio
        </button>
      </div>

      <NewsWallMulticanal
        publicFlashes={[]}
        memberFlashes={null}
        sponsorFlashes={null}
        pressFlashes={pressFlashes}
        hideTabs
        defaultTab="prensa"
      />

      {showForm && (
        <MedioForm medio={null} onClose={() => { setShowForm(false); loadPressFlashes() }} />
      )}
    </div>
  )
}