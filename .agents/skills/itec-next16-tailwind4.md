---
name: itec-next16-tailwind4
description: "Convenciones de Frontend con Next.js 16 y Tailwind v4"
---

# Next.js 16 & Tailwind v4

- `proxy.ts`: Next.js 16 reemplaza `middleware.ts` con `proxy.ts`. No uses `middleware.ts`.
- Tailwind v4: No usar directivas `@tailwind`. Usar `@import "tailwindcss"`.
- `force-dynamic` y `unstable_cache` fs: En la landing, los logos se leen del filesystem.
- `suppressHydrationWarning`: Necesario en el root HTML por los mtimes de logos.
