import { Navbar } from '@/components/landing/Navbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { AboutSection } from '@/components/landing/AboutSection'
import { ComisionesSection } from '@/components/landing/ComisionesSection'
import { IdeasSection } from '@/components/landing/IdeasSection'
import { ImpactSection } from '@/components/landing/ImpactSection'
import { Footer } from '@/components/landing/Footer'

export default function HomePage() {
  return (
    <main className="relative">
      <HeroSection />
      <Navbar />

      <div className="section-divider" />
      <ImpactSection />

      <div className="section-divider" />
      <AboutSection />

      <div className="section-divider" />
      <ComisionesSection />

      <div className="section-divider" />
      <IdeasSection />

      <Footer />
    </main>
  )
}
