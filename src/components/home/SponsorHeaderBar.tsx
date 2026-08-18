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

  const validLogos = Array.isArray(logos) ? logos : [];

  if (!isMounted || validLogos.length === 0) {
    return (
      <div className="relative w-full min-h-[44px] bg-black/60 py-2 border-b border-white/10" />
    );
  }

  const duplicatedLogos = [...validLogos, ...validLogos];

  return (
    <div 
      suppressHydrationWarning
      className="relative w-full overflow-hidden bg-black/60 backdrop-blur-sm py-2 border-b border-white/10 min-h-[44px] z-30"
    >
      <div 
        className="animate-marquee-infinite flex items-center gap-10 w-max"
        style={{ animationDuration: '40s' }} /* Duración incrementada para hacerlo 15% más lento (era 35s, lo subo un poco más para asegurar suavidad) */
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
