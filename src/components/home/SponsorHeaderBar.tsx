'use client';

import React, { useState, useEffect } from 'react';

export interface SponsorLogo {
  url: string;
  nombre?: string;
}

interface SponsorHeaderBarProps {
  logos?: SponsorLogo[];
}

export function SponsorHeaderBar({ logos = [] }: SponsorHeaderBarProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Render inicial para SSR (evita hydration mismatch)
  if (!isMounted) {
    return (
      <div className="w-full h-16 min-h-[64px] bg-black/60 border-y border-white/10" />
    );
  }

  // Si no hay logos reales cargados, mostramos logos de prueba
  const displayLogos = logos.length > 0 ? logos : [
    { url: 'https://via.placeholder.com/150x50/ffffff/000000?text=Sponsor+1', nombre: 'Sponsor 1' },
    { url: 'https://via.placeholder.com/150x50/ffffff/000000?text=Sponsor+2', nombre: 'Sponsor 2' },
    { url: 'https://via.placeholder.com/150x50/ffffff/000000?text=Sponsor+3', nombre: 'Sponsor 3' },
  ];

  const duplicatedLogos = [...displayLogos, ...displayLogos];

  return (
    <div className="relative z-30 w-full min-h-[64px] overflow-hidden bg-black/50 backdrop-blur-md py-3 border-y border-white/10">
      <div className="animate-marquee-infinite flex items-center gap-10 w-max">
        {duplicatedLogos.map((logo, index) => (
          <div 
            key={`${logo.url}-${index}`} 
            className="flex-shrink-0 flex items-center justify-center px-4"
          >
            <img 
              src={logo.url} 
              alt={logo.nombre || `Sponsor ${index + 1}`}
              className="h-10 sm:h-12 w-auto max-w-none object-contain opacity-90 hover:opacity-100 transition-opacity filter brightness-200"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default SponsorHeaderBar;
