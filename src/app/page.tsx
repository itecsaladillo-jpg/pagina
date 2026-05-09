import { Navbar } from '@/components/landing/Navbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { AboutSection } from '@/components/landing/AboutSection'
import { ComisionesSection } from '@/components/landing/ComisionesSection'
import { CapacitacionesSection } from '@/components/landing/CapacitacionesSection'
import { IdeasSection } from '@/components/landing/IdeasSection'
import { Footer } from '@/components/landing/Footer'

export default function HomePage() {
  return (
    <main className="relative">
      <HeroSection />
      <Navbar />

      <div className="section-divider" />
      <AboutSection />

      <div className="section-divider" />
      <ComisionesSection />

      <div className="section-divider" />
      <CapacitacionesSection />

      <div className="section-divider" />
      <IdeasSection />

      <Footer />
    </main>
  )
}
