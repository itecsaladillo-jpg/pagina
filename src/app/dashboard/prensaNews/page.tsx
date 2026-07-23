'use client'

import { useState, useEffect } from 'react'
import { NewsWallMulticanal } from '@/components/comunicacion/NewsWallMulticanal'
import { MedioForm } from '@/app/dashboard/prensa/MedioForm'
import { Plus } from 'lucide-react'

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
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/20"
        >
          <Plus size={16} />
          Nuevo Medio de Comunicación
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