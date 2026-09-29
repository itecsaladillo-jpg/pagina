---
name: itec-verify-frontend-next16
description: "Checklist de verificación de frontend Next.js 16 en ITEC"
---

# Verificación de Frontend Next.js 16

## Breaking Changes Next.js 16.3.0
- [ ] `params` y `searchParams` en páginas y layouts son promesas (`Promise<{ slug: string }>`). Siempre `await params`.
- [ ] `cookies()` y `headers()` de `next/headers` son asíncronos (`await cookies()`).
- [ ] `proxy.ts` (reemplaza `middleware.ts`) corre en Edge.
- [ ] Tailwind CSS v4: Sin `@tailwind` directives legacy. Import `@import "tailwindcss";` y `@theme`.

## Estructura de Páginas
- [ ] 48 archivos page.tsx · 2 layouts · 15 route handlers · 20 archivos `'use server'` · 4 boundaries (`loading.tsx` / `error.tsx` en raíz y dashboard)
- [ ] Rutas públicas: `/`, `/acceso-pendiente`, `/articulo/[slug]`, `/capacitaciones/[id]`, `/certificados/[codigo]`, `/clases/[id]`, `/eventos/[id]/*`, `/login`, `/mapa-productivo`, `/muro`, `/registro-mapa`, `/socios`, `/sponsors/[id]`, `/votar`
- [ ] Dashboard: `/dashboard/*` (28 subrutas)

## Sistema i18n
- [ ] `src/locales/dictionary.ts` (~1100 líneas, 16 secciones/idioma)
- [ ] Idiomas: ES, EN, PT
- [ ] `src/contexts/LanguageContext.tsx` → Contexto React i18n (es/en/pt, queueMicrotask hydrated)
- [ ] `FloatingLanguageSelector.tsx` → FAB selector idioma
- [ ] Sin hidratación mismatch al cambiar idioma

## Componentes
- [ ] `ChatWidget.tsx` + `ChatWidget.css` → Botón flotante con avatar dinámico, persistencia localStorage, auto-scroll, atajos de teclado
- [ ] `Navbar.tsx` → Navegación principal con selector de idioma
- [ ] `HeroSection.tsx` → Sección principal con streaming de YouTube
- [ ] `NewsWallMulticanal.tsx` → Muro público multicanal
- [ ] `VotingClient.tsx` → Votación pública en tiempo real

## Configuración de Build
- [ ] `next.config.ts`: Imágenes AVIF/WebP, TTL 30 días, remotePatterns para Supabase, headers cache para favicons
- [ ] `vercel.json`: maxDuration 60s para `/api/asistente` y `/api/news/process`
- [ ] `tsconfig.json`: target ES2017, `strict: true`, `noEmit`, moduleResolution `bundler`, JSX react-jsx, incremental
- [ ] `eslint.config.mjs`: Flat config ESLint 9 + next/core-web-vitals + TS
- [ ] `postcss.config.mjs`: único plugin `@tailwindcss/postcss` (Tailwind v4)

## Criterios de Build
- [ ] `npm run build` compila sin errores
- [ ] `npm run lint` pasa sin errores críticos
- [ ] Server Components usan `await` correctamente para `params`, `searchParams`, `cookies()`, `headers()`
- [ ] Client Components no usan APIs del lado del servant incorrectamente