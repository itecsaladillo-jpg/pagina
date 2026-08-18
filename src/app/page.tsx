import fs from 'fs';
import path from 'path';
import nextDynamic from 'next/dynamic'
import { Navbar } from '@/components/landing/Navbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { Footer } from '@/components/landing/Footer'
import { FloatingLanguageSelector } from '@/components/landing/FloatingLanguageSelector'
import { SponsorHeaderBar } from '@/components/home/SponsorHeaderBar'

// Forzar renderizado dinámico en cada request (desactiva cache estático de Vercel/Next.js)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AboutSection = nextDynamic(() => import('@/components/landing/AboutSection').then(m => m.AboutSection))
const ComisionesSection = nextDynamic(() => import('@/components/landing/ComisionesSection').then(m => m.ComisionesSection))
const IdeasSection = nextDynamic(() => import('@/components/landing/IdeasSection').then(m => m.IdeasSection))
const ImpactSection = nextDynamic(() => import('@/components/landing/ImpactSection').then(m => m.ImpactSection))
const VideotecaSection = nextDynamic(() => import('@/components/landing/VideotecaSection').then(m => m.VideotecaSection))

export default async function HomePage() {
  // Ruta absoluta hacia la carpeta public/sponsors/blanco
  const sponsorsDir = path.join(process.cwd(), 'public', 'sponsors', 'blanco');
  
  let sponsorLogos: { url: string; nombre: string }[] = [];

  if (fs.existsSync(sponsorsDir)) {
    const files = fs.readdirSync(sponsorsDir);

    sponsorLogos = files
      .filter((file) => !file.startsWith('.') && /\.(png|jpe?g|svg|webp)$/i.test(file))
      .map((file) => {
        const filePath = path.join(sponsorsDir, file);
        const stats = fs.statSync(filePath);

        return {
          // URL relativa accesible desde Next.js + timestamp para romper cache
          url: `/sponsors/blanco/${file}?v=${stats.mtimeMs}`,
          nombre: file.replace(/\.[^/.]+$/, ''),
        };
      });
  }

  console.log(`✅ Logos locales cargados (${sponsorLogos.length}):`, sponsorLogos.map(s => s.nombre));

  return (
    <main className="relative min-h-screen bg-black text-white pb-16">
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
      
      {/* Pasar el array de logos locales */}
      <SponsorHeaderBar logos={sponsorLogos} />

      {/* Selector de Idiomas flotante premium (der) */}
      <FloatingLanguageSelector />
    </main>
  )
}
