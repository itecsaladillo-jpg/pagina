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
      // Ocultar tan pronto como el scroll sea mayor a 0 (al iniciar el movimiento)
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    // Escucha de scroll optimizada
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Comprobación inicial

    return () => window.removeEventListener('scroll', handleScroll);
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
      className={`relative w-full overflow-hidden bg-black/60 backdrop-blur-sm py-2 border-b border-white/10 min-h-[44px] z-30 transition-all duration-500 ease-in-out ${
        isScrolled 
          ? 'opacity-0 pointer-events-none max-h-0 min-h-0 py-0 border-transparent overflow-hidden' 
          : 'opacity-100 max-h-[60px] min-h-[44px]'
      }`}
    >
      <div 
        className="animate-marquee-infinite flex items-center gap-10 w-max"
        style={{ animationDuration: '35s' }}
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
