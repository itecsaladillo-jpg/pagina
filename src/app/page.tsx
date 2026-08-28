import fs from 'fs';
import path from 'path';
import { unstable_cache } from 'next/cache';
import nextDynamic from 'next/dynamic'
import { Navbar } from '@/components/landing/Navbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { Footer } from '@/components/landing/Footer'
import { FloatingLanguageSelector } from '@/components/landing/FloatingLanguageSelector'
import { SponsorHeaderBar } from '@/components/home/SponsorHeaderBar'

// ISR: regenerar el homepage cada 60 segundos en Vercel
export const revalidate = 60;

const AboutSection = nextDynamic(() => import('@/components/landing/AboutSection').then(m => m.AboutSection))
const ComisionesSection = nextDynamic(() => import('@/components/landing/ComisionesSection').then(m => m.ComisionesSection))
const IdeasSection = nextDynamic(() => import('@/components/landing/IdeasSection').then(m => m.IdeasSection))
const ImpactSection = nextDynamic(() => import('@/components/landing/ImpactSection').then(m => m.ImpactSection))
const VideotecaSection = nextDynamic(() => import('@/components/landing/VideotecaSection').then(m => m.VideotecaSection))

// Cachear la lectura del filesystem por 1 hora (3600s):
// evita fs.readdirSync/fs.statSync en cada request (I/O síncrono en serverless).
// El cache-buster ?v=mtimeMs es determinístico (sin Date.now() en SSR → sin errores de hidratación).
const getSponsorLogos = unstable_cache(
  async () => {
    try {
      const sponsorsDir = path.join(process.cwd(), 'public', 'sponsors', 'blanco');
      if (!fs.existsSync(sponsorsDir)) return [];

      const files = fs.readdirSync(sponsorsDir);

      return files
        .filter((file) => !file.startsWith('.') && /\.(png|jpe?g|svg|webp)$/i.test(file))
        .map((file) => {
          const filePath = path.join(sponsorsDir, file);
          const stats = fs.statSync(filePath);

          return {
            url: `/sponsors/blanco/${file}?v=${stats.mtimeMs}`,
            nombre: file.replace(/\.[^/.]+$/, ''),
          };
        });
    } catch (error) {
      console.error('Error leyendo logos de sponsors:', error);
      return [];
    }
  },
  ['sponsor-logos-landing'],
  { revalidate: 3600 }
);

export default async function HomePage() {
  const sponsorLogos = await getSponsorLogos();

  return (
    <main className="relative min-h-screen bg-black text-white pb-16">
      {/* SponsorHeaderBar fuera del wrapper: fixed se ancla al viewport y NO se mueve */}
      <SponsorHeaderBar logos={sponsorLogos} />

      <HeroSection />

      {/* Navbar sticky: fuera del translate para no verse cortado arriba */}
      <Navbar />

      {/* Resto del contenido sube 30px para solapar sutilmente con el hero */}
      <div className="-translate-y-[30px]">
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
      </div>

      {/* Selector de Idiomas: fuera del wrapper para anclarse al viewport, junto al asistente */}
      <FloatingLanguageSelector />
    </main>
  )
}