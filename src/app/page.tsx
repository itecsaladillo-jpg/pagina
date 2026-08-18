import dynamic from 'next/dynamic'
import { Navbar } from '@/components/landing/Navbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { Footer } from '@/components/landing/Footer'
import { FloatingLanguageSelector } from '@/components/landing/FloatingLanguageSelector'
import { createClient } from '@/lib/supabase/server'


const AboutSection = dynamic(() => import('@/components/landing/AboutSection').then(m => m.AboutSection))
const ComisionesSection = dynamic(() => import('@/components/landing/ComisionesSection').then(m => m.ComisionesSection))
const IdeasSection = dynamic(() => import('@/components/landing/IdeasSection').then(m => m.IdeasSection))
const ImpactSection = dynamic(() => import('@/components/landing/ImpactSection').then(m => m.ImpactSection))
const VideotecaSection = dynamic(() => import('@/components/landing/VideotecaSection').then(m => m.VideotecaSection))

export default async function HomePage() {
  const supabase = await createClient()
  
  // 1. Obtener la lista de archivos de la carpeta 'monocromo'
  const { data: files } = await supabase.storage
    .from('sponsors-logos')
    .list('monocromo', { limit: 100 });

  let sponsorLogos: { url: string; nombre: string }[] = [];

  if (files && files.length > 0) {
    // 2. Generar las URLs públicas de cada logo
    sponsorLogos = files
      .filter((file) => file.name !== '.emptyFolderPlaceholder')
      .map((file) => {
        const { data } = supabase.storage
          .from('sponsors-logos')
          .getPublicUrl(`monocromo/${file.name}`);

        return {
          url: data.publicUrl,
          nombre: file.name.split('.')[0] || 'Sponsor ITEC',
        };
      });
  }

  return (
    <main className="relative">
      <SponsorHeaderBar logos={sponsorLogos} />
      <HeroSection />
      <Navbar />

      <div className="section-divider" />
      <ImpactSection />

      <div className="section-divider" />
      <VideotecaSection />

      <div className="section-divider" />
      <AboutSection />

      <div className="section-divider" />
      <ComisionesSection />

      <div className="section-divider" />
      <IdeasSection />

      <Footer />

      {/* Selector de Idiomas flotante premium (der) */}
      <FloatingLanguageSelector />
    </main>
  )
}
