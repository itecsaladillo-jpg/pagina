import { createClient } from '@/lib/supabase/server'

export async function SponsorHeaderBar() {
  const supabase = await createClient()
  
  // Fetch only active sponsors with monocromo logos
  const { data: sponsors } = await supabase
    .from('sponsors')
    .select('name, logo_monocromo_url')
    .eq('is_active', true)
    .not('logo_monocromo_url', 'is', null)

  if (!sponsors || sponsors.length === 0) {
    // return null // Temporarily show nothing for debugging
    return <div className="p-4 bg-red-500 text-white text-xs">Debug: No sponsors found (Active + Logos)</div>
  }
  
  // Duplicamos la lista para crear el loop infinito fluido
  const duplicatedLogos = [...sponsors, ...sponsors];

  return (
    <div className="w-full overflow-hidden bg-black/40 backdrop-blur-md py-3 border-y border-white/10 z-20">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-infinite {
          display: flex;
          width: max-content;
          animation: marquee 40s linear infinite;
        }
        .animate-marquee-infinite:hover {
          animation-play-state: paused;
        }
      `}</style>
      
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
