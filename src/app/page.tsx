import dynamic from 'next/dynamic'
import { Navbar } from '@/components/landing/Navbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { Footer } from '@/components/landing/Footer'
import { FloatingLanguageSelector } from '@/components/landing/FloatingLanguageSelector'

const SponsorHeaderBar = dynamic(
  () => import('@/components/home/SponsorHeaderBar').then(mod => mod.SponsorHeaderBar),
  { ssr: false }
)
const AboutSection = dynamic(() => import('@/components/landing/AboutSection').then(m => m.AboutSection))
const ComisionesSection = dynamic(() => import('@/components/landing/ComisionesSection').then(m => m.ComisionesSection))
const IdeasSection = dynamic(() => import('@/components/landing/IdeasSection').then(m => m.IdeasSection))
const ImpactSection = dynamic(() => import('@/components/landing/ImpactSection').then(m => m.ImpactSection))
const VideotecaSection = dynamic(() => import('@/components/landing/VideotecaSection').then(m => m.VideotecaSection))

export default function HomePage() {
  return (
    <main className="relative">
      <SponsorHeaderBar />
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
