---
name: itec-custom-i18n
description: "Sistema Multi-idioma (i18n) Custom de ITEC"
---

# Sistema Multi-idioma Custom

- Basado en Contexto: `LanguageContext.tsx` y `useLanguage()`.
- Diccionario: `dictionary.ts` (ES, EN, PT).
- Regla crítica: El diccionario incluye IDs dinámicos hardcodeados (UUIDs de artículos y resúmenes de videos). Para agregar contenido traducido, debes modificar las 3 claves (`es`, `en`, `pt`) simultáneamente en `dictionary.ts`.
