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
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const validLogos = Array.isArray(logos) ? logos : [];

  if (!isMounted) {
    return (
      <div className="relative w-full h-[44px] bg-transparent border-b border-white/10" />
    );
  }

  if (validLogos.length === 0) {
    return null;
  }

  const duplicatedLogos = [...validLogos, ...validLogos, ...validLogos];

  return (
    <div 
      suppressHydrationWarning
      className={`relative w-full overflow-hidden bg-transparent transition-all duration-500 ease-in-out z-30 ${
        isScrolled 
          ? 'opacity-0 max-h-0 min-h-0 py-0 border-transparent pointer-events-none' 
          : 'opacity-100 max-h-[60px] min-h-[44px] py-2 border-b border-white/10'
      }`}
    >
      <div 
        className="animate-marquee-infinite flex items-center gap-10 w-max"
        style={{ animationDuration: '42s' }} /* Duración ajustada a 42s (20% más lento) */
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
