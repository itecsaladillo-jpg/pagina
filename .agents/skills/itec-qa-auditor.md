---
name: itec-qa-auditor
description: "Reglas de auditoría, compatibilidad Next.js 16, seguridad RLS y calidad en ITEC"
---

# Auditoría Técnica, QA y Gotchas (ITEC)

Basado en las secciones 5, 7, 19, 21 y 22 de `ITEC_CODEGUIDE.md`:

## 1. Verificación Next.js 16 (Breaking Changes)
- **App Router estricto:** `params` y `searchParams` en páginas y layouts son promesas (`Promise<{ slug: string }>`). Siempre `await params`.
- **Headers y Cookies:** `cookies()` y `headers()` de `next/headers` son asíncronos (`await cookies()`).
- **Middleware:** `proxy.ts` corre en Edge y delega en el proxy de Next.js 16.
- **Tailwind CSS v4:** Sin archivo de configuración tradicional ni `@tailwind` directives legacy. Import `@import "tailwindcss";` y `@theme`.

## 2. Auditoría de Server Actions
Toda acción en el servidor debe cumplir la lista de control:
1. `const member = await getCurrentMember();` al inicio.
2. Comprobar roles autorizados (`admin`, `coordinador` según corresponda).
3. Validar payloads con esquemas Zod (`safeParse`).
4. Revalidar rutas afectadas con `revalidatePath()`.
5. Retornar siempre objetos serializables tipados: `{ success: true, data?: ... }` o `{ success: false, error: string }`.

## 3. Quirks y Gotchas Históricos Conocidos (§22)
- **Inconsistencia de nombres en eventos:** Conviven nombres en singular y plural (`evento_*` y `eventos_*`). Verificar siempre la migración fuente antes de escribir una consulta.
- **Acciones ITEC:** Referenciada como `itec_actions` en la BD y a veces como `acciones_itec` en nombres de variables o servicios.
- **Deduplicación del semáforo:** El semáforo presencial dedup en servidor con `dispositivo_id` y en cliente con cooldown de 5s. Cada fila en `evento_semaforo_votos` cuenta como un voto negativo.
- **Inconsistencia de keys de Supabase en `.env.local`:** La variable `SUPABASE_SERVICE_ROLE_KEY` puede tener cargada la clave anónima en entornos locales; validar con JWT payload antes de asumir privilegios de bypass RLS.
- **Builds limpios:** Ejecutar siempre `npm run build` para garantizar que la compilación de Turbopack y el chequeo de tipos de TypeScript pasan al 100%.
