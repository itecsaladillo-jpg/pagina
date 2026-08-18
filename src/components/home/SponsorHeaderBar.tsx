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
    return null
  }
  
  return (
    <div className="w-full overflow-hidden py-2 px-2 bg-black/30 backdrop-blur-sm z-20">
      <div className="flex flex-row items-center justify-between w-full gap-1 sm:gap-2">
        {sponsors.map((logo, index) => (
          <div key={index} className="flex-1 min-w-0 flex items-center justify-center p-0.5">
            <img 
              src={logo.logo_monocromo_url || ''} 
              alt={logo.name || `Sponsor ${index + 1}`}
              className="max-h-6 sm:max-h-8 w-auto max-w-full object-contain opacity-85 hover:opacity-100 transition-opacity"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
