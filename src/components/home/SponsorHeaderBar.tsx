'use client';

import React, { useEffect, useState } from 'react';

export interface SponsorLogo {
  url: string;
  nombre?: string;
}

// Fallback en caso de que no haya logos cargados
const DEFAULT_LOGOS: SponsorLogo[] = [
  { url: '/sponsors/blanco/lideragro.png', nombre: 'LiderAgro' },
  { url: '/sponsors/blanco/angelani.png', nombre: 'Angelani' },
  { url: '/sponsors/blanco/coop agricola.png', nombre: 'Coop Agricola' },
];

export function SponsorHeaderBar({ logos = [] }: { logos?: SponsorLogo[] }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Los logos llegan por props desde el servidor (SSR) → mismo árbol en ambos lados
  const validLogos = Array.isArray(logos) && logos.length > 0 ? logos : DEFAULT_LOGOS;
  const duplicatedLogos = [...validLogos, ...validLogos, ...validLogos, ...validLogos];

  return (
    <div
      suppressHydrationWarning
      className={`relative w-full overflow-hidden bg-transparent transition-all duration-500 ease-in-out z-50 ${
        isScrolled
          ? 'opacity-0 max-h-0 min-h-0 py-0 border-transparent pointer-events-none'
          : 'opacity-100 max-h-[60px] min-h-[44px] py-2 border-b border-white/10'
      }`}
    >
      <div
        className="animate-marquee-infinite flex items-center gap-10 w-max"
        style={{ animationDuration: '42s' }}
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
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default SponsorHeaderBar;