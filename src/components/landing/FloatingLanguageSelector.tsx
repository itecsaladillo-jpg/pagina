'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { Globe, Check } from 'lucide-react';

export function FloatingLanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  // Cerrar al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Dropup Menu */}
      {open && (
        <div 
          className="bg-slate-950/90 border border-white/[0.08] rounded-2xl p-2 shadow-2xl backdrop-blur-xl flex flex-col gap-1 min-w-[140px] animate-in fade-in slide-in-from-bottom-3 duration-200"
          style={{
            boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.1)',
          }}
        >
          {languages.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                  isSelected 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </div>
                {isSelected && <Check size={14} className="text-blue-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setOpen(!open)}
        className="h-14 rounded-full flex items-center gap-3 px-5 transition-all active:scale-95 shadow-xl hover:shadow-2xl border border-white/[0.08] hover:border-blue-500/40 cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.95))',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 10px rgba(59,130,246,0.05)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        aria-label="Seleccionar idioma"
        title="Idioma / Language"
      >
        <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
          <Globe size={16} />
        </div>
        <span className="text-[13px] font-black tracking-wider text-slate-200 uppercase flex items-center gap-2">
          {currentLang.flag}
        </span>
      </button>
    </div>
  );
}
