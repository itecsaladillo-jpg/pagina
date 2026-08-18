'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Sponsor {
  name: string
  logo_monocromo_url: string | null
}

export function SponsorHeaderBar() {
  const [isMounted, setIsMounted] = useState(false)
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  
  useEffect(() => {
    setIsMounted(true)
    
    const fetchSponsors = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('sponsors')
        .select('name, logo_monocromo_url')
        .eq('is_active', true)
        .not('logo_monocromo_url', 'is', null)
      
      if (data) setSponsors(data)
    }
    
    fetchSponsors()
  }, [])

  if (!isMounted || sponsors.length === 0) {
    return <div className="w-full h-16 bg-black/40 backdrop-blur-md" />
  }

  // Duplicamos la lista para crear el loop infinito fluido
  const duplicatedLogos = [...sponsors, ...sponsors]

  return (
    <div className="absolute top-0 left-0 w-full overflow-hidden bg-black/40 backdrop-blur-md py-3 border-b border-white/10 z-50">
      <div className="animate-marquee-infinite flex items-center gap-10">
        {duplicatedLogos.map((logo, index) => (
          <div 
            key={`${logo.logo_monocromo_url}-${index}`} 
            className="flex-shrink-0 flex items-center justify-center px-4"
          >
            <img 
              src={logo.logo_monocromo_url || ''} 
              alt={logo.name || `Sponsor ${index + 1}`}
              className="h-10 sm:h-12 w-auto max-w-none object-contain opacity-85 hover:opacity-100 transition-opacity filter brightness-200"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
