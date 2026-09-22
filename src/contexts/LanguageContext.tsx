'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { dictionary } from '@/locales/dictionary'

export type Language = 'es' | 'en' | 'pt'

interface LanguageContextProps {
  language: Language
  setLanguage: (lang: Language) => void
  dict: typeof dictionary.es
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es')

  // Cargar preferencia persistida del navegador tras montar
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('itec_lang') as Language
      let targetLang: Language | null = null
      if (savedLang && (savedLang === 'es' || savedLang === 'en' || savedLang === 'pt')) {
        targetLang = savedLang
      } else {
        const browserLang = navigator.language.slice(0, 2)
        if (browserLang === 'en' || browserLang === 'pt') {
          targetLang = browserLang as Language
        }
      }
      if (targetLang && targetLang !== 'es') {
        queueMicrotask(() => {
          setLanguageState(targetLang!)
        })
      }
    } catch {
      // Ignorar entornos sin storage disponible
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('itec_lang', lang)
  }

  // Fallback seguro durante SSR o antes del montaje para evitar problemas de hidratación
  const dict = (dictionary[language] || dictionary.es) as typeof dictionary.es

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dict }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage debe ser usado dentro de un LanguageProvider')
  }
  return context
}
