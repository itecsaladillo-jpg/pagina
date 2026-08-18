'use client';

import React, { useState, useEffect } from 'react';

export interface SponsorLogo {
  url: string;
  nombre?: string;
}

// Logos de respaldo si no existen imágenes en public/sponsors/blanco
const DEFAULT_LOGOS: SponsorLogo[] = [
  { url: 'https://placehold.co/180x50/transparent/FFF?text=Sponsor+1', nombre: 'Sponsor 1' },
  { url: 'https://placehold.co/180x50/transparent/FFF?text=Sponsor+2', nombre: 'Sponsor 2' },
  { url: 'https://placehold.co/180x50/transparent/FFF?text=Sponsor+3', nombre: 'Sponsor 3' },
  { url: 'https://placehold.co/180x50/transparent/FFF?text=Sponsor+4', nombre: 'Sponsor 4' },
];

export function SponsorHeaderBar({ logos = [] }: { logos?: SponsorLogo[] }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handleScroll = () => {
      // Activa el fade out cuando el usuario desplaza más de 10px
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeLogos = Array.isArray(logos) && logos.length > 0 ? logos : DEFAULT_LOGOS;
  const duplicatedLogos = [...activeLogos, ...activeLogos, ...activeLogos, ...activeLogos];

  if (!isMounted) return null;

  return (
    <div
      suppressHydrationWarning
      className={`fixed bottom-0 left-0 w-full z-40 bg-transparent overflow-hidden transition-all duration-500 ease-in-out ${
        isScrolled
          ? 'opacity-0 translate-y-4 pointer-events-none'
          : 'opacity-100 translate-y-0 py-3 border-t border-white/10'
      }`}
    >
      <div
        className="animate-marquee-infinite flex items-center gap-10 w-max"
        style={{ animationDuration: '140s' }} /* Velocidad reducida 40% (140s en vez de 84s) */
      >
        {duplicatedLogos.map((logo, index) => (
          <div
            key={`${logo.url}-${index}`}
            className="flex-shrink-0 flex items-center justify-center px-4"
          >
            <img
              src={logo.url}
              alt={logo.nombre || `Sponsor ${index + 1}`}
              className="h-7 sm:h-8 w-auto max-w-none object-contain opacity-80 hover:opacity-100 transition-opacity filter brightness-200"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default SponsorHeaderBar;