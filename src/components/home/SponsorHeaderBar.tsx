'use client';

import React, { useState, useEffect } from 'react';

export interface SponsorLogo {
  url: string;
  nombre?: string;
}

export function SponsorHeaderBar({ logos = [] }: { logos?: SponsorLogo[] }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Normalizar array de logos sin placeholders externos
  const validLogos = Array.isArray(logos) ? logos : [];

  // Si no se ha montado o no hay logos válidos, renderizar contenedor neutro identico en SSR y Cliente
  if (!isMounted || validLogos.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 w-full min-h-[48px] bg-transparent py-2 border-t border-white/5" />
    );
  }

  const duplicatedLogos = [...validLogos, ...validLogos];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 w-full overflow-hidden bg-transparent py-2 border-t border-white/5 min-h-[48px]">
      <div className="animate-marquee-infinite flex items-center gap-10 w-max">
        {duplicatedLogos.map((logo, index) => (
          <div 
            key={`${logo.url}-${index}`} 
            className="flex-shrink-0 flex items-center justify-center px-4"
          >
            <img 
              src={logo.url} 
              alt={logo.nombre || `Sponsor ${index + 1}`}
              className="h-8 sm:h-9 w-auto max-w-none object-contain opacity-75 hover:opacity-100 transition-opacity filter brightness-200"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default SponsorHeaderBar;
