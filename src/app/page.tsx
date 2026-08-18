import nextDynamic from 'next/dynamic'
import { Navbar } from '@/components/landing/Navbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { Footer } from '@/components/landing/Footer'
import { FloatingLanguageSelector } from '@/components/landing/FloatingLanguageSelector'
import { SponsorHeaderBar } from '@/components/home/SponsorHeaderBar'
import { createClient } from '@/lib/supabase/server'

// Forzar renderizado dinámico en cada request (desactiva cache estático de Vercel/Next.js)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AboutSection = nextDynamic(() => import('@/components/landing/AboutSection').then(m => m.AboutSection))
const ComisionesSection = nextDynamic(() => import('@/components/landing/ComisionesSection').then(m => m.ComisionesSection))
const IdeasSection = nextDynamic(() => import('@/components/landing/IdeasSection').then(m => m.IdeasSection))
const ImpactSection = nextDynamic(() => import('@/components/landing/ImpactSection').then(m => m.ImpactSection))
const VideotecaSection = nextDynamic(() => import('@/components/landing/VideotecaSection').then(m => m.VideotecaSection))

export default async function HomePage() {
  const supabase = await createClient()
  
  // 1. Obtener la lista de archivos de la carpeta 'blanco'
  const BUCKET_NAME = 'sponsors-logos';
  const FOLDER_NAME = 'blanco';

  const { data: files } = await supabase.storage
    .from(BUCKET_NAME)
    .list(FOLDER_NAME, { 
      limit: 100,
      sortBy: { column: 'name', order: 'asc' }
    });

  let sponsorLogos: { url: string; nombre: string }[] = [];

  if (error) {
    console.error('❌ Error Supabase Storage:', error.message);
  }

  let sponsorLogos: { url: string; nombre: string }[] = [];

  if (files && files.length > 0) {
    // 2. Generar las URLs públicas de cada logo con cache-buster
    sponsorLogos = files
      .filter((file) => file.name !== '.emptyFolderPlaceholder' && !file.name.startsWith('.'))
      .map((file) => {
        const { data } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(`${FOLDER_NAME}/${file.name}`);

        // Romper caché de CDN/Navegador agregando timestamp
        const lastUpdated = (file as any).updated_at 
          ? new Date((file as any).updated_at).getTime() 
          : Date.now();

        return {
          url: `${data.publicUrl}?t=${lastUpdated}`,
          nombre: file.name.split('.')[0] || 'Sponsor ITEC',
        };
      });
  }

  console.log(`✅ Logos encontrados (${sponsorLogos.length}):`, sponsorLogos);

  return (
    <main className="relative">
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
      
      <SponsorHeaderBar logos={sponsorLogos} />

      {/* Selector de Idiomas flotante premium (der) */}
      <FloatingLanguageSelector />
    </main>
  )
}
