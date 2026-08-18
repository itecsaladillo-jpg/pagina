'use client';

import React, { useState, useEffect } from 'react';

export interface SponsorLogo {
  url: string;
  nombre?: string;
}

export function SponsorHeaderBar({ logos = [] }: { logos?: SponsorLogo[] }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handleScroll = () => {
      // Ocultar tan pronto como el scroll sea mayor a 0
      setIsScrolled(window.scrollY > 0);
    };

    // Escucha de scroll optimizada
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Comprobación inicial

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const validLogos = Array.isArray(logos) ? logos : [];

  // Render inicial consistente para SSR y Cliente
  // Usamos clases que definen el espacio para evitar saltos de layout
  return (
    <div 
      suppressHydrationWarning
      className={`fixed bottom-0 left-0 right-0 z-40 w-full overflow-hidden bg-black/60 backdrop-blur-sm py-2 border-t border-white/10 min-h-[44px] transition-all duration-500 ease-in-out ${
        isMounted && isScrolled 
          ? 'opacity-0 pointer-events-none' 
          : 'opacity-100'
      }`}
    >
      <div 
        className="animate-marquee-infinite flex items-center gap-10 w-max"
        style={{ animationDuration: '35s' }}
      >
        {duplicatedLogos(validLogos).map((logo, index) => (
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

// Helper para duplicar logos
function duplicatedLogos(logos: SponsorLogo[]) {
  return [...logos, ...logos];
}

export default SponsorHeaderBar;
