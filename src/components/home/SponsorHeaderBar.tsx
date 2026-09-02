'use client';

import React, { useState, useEffect, useMemo } from 'react';

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

// 2 copias son suficientes para el loop seamless de translateX(-50%)
const MARQUEE_COPIES = 2;

export function SponsorHeaderBar({ logos = [] }: { logos?: SponsorLogo[] }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handleScroll = () => {
      // Activa el fade out cuando el usuario desplaza más de 10px
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeLogos = useMemo(
    () => (Array.isArray(logos) && logos.length > 0 ? logos : DEFAULT_LOGOS),
    [logos]
  );

  // Memoizado: evita recrear el array duplicado en cada re-render (scroll, hover)
  const duplicatedLogos = useMemo(
    () => Array.from({ length: MARQUEE_COPIES }, () => activeLogos).flat(),
    [activeLogos]
  );

  if (!isMounted) return null;

  return (
    <div
      suppressHydrationWarning
      className={`fixed bottom-0 left-0 w-full z-40 overflow-hidden transition-all duration-500 ease-in-out backdrop-blur-md border-t border-white/10 ${
        isScrolled
          ? 'opacity-0 translate-y-4 pointer-events-none'
          : 'opacity-100 translate-y-0 py-4'
      }`}
    >
      <div
        className="animate-marquee-infinite flex items-center gap-10 w-max will-change-transform"
        style={{ animationDuration: '70s' }} /* 2 copias = mitad de distancia que con 4; 70s mantiene la velocidad visual previa (140s con 4 copias) */
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
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default SponsorHeaderBar;