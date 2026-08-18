'use client';

import React, { useState, useEffect } from 'react';

export interface SponsorLogo {
  url: string;
  nombre?: string;
}

export function SponsorHeaderBar({ logos = [] }: { logos?: SponsorLogo[] }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsMounted(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const target = document.getElementById('seccion-impacto');
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) observer.unobserve(target);
    };
  }, []);

  const validLogos = Array.isArray(logos) ? logos : [];

  if (!isMounted || validLogos.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 w-full min-h-[44px] bg-black/60 py-2 border-t border-white/10" />
    );
  }

  const duplicatedLogos = [...validLogos, ...validLogos];

  return (
    <div 
      suppressHydrationWarning
      className={`fixed bottom-0 left-0 right-0 z-40 w-full overflow-hidden bg-black/60 backdrop-blur-sm py-2 border-t border-white/10 min-h-[44px] transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div 
        className="animate-marquee-infinite flex items-center gap-10 w-max"
        style={{ animationDuration: '40s' }}
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
