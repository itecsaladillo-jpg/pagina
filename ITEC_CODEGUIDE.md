# ITEC Saladillo — Guía Técnica Integral para Agentes de Desarrollo

> **Propósito:** Este documento es la fuente de verdad técnica del proyecto. Está diseñado para ser usado como contexto por agentes de IA que continúen el desarrollo. Describe el stack, la arquitectura, cada página, cada funcionalidad, las convenciones obligatorias y los quirks conocidos del codebase.
>
> **Regla previa a escribir código:** Este proyecto usa Next.js 16.3.0, que tiene breaking changes respecto a versiones conocidas. Leer las guías en `node_modules/next/dist/docs/` antes de implementar features nuevas (ver `AGENTS.md`).

---

## Índice

1. [Descripción General](#1-descripción-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Scripts npm](#3-scripts-npm)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Configuración de Build y Despliegue](#5-configuración-de-build-y-despliegue)
6. [Autenticación y Autorización](#6-autenticación-y-autorización)
7. [Seguridad](#7-seguridad)
8. [Base de Datos (Supabase)](#8-base-de-datos-supabase)
9. [Sistema de IA](#9-sistema-de-ia)
10. [Sistema de Noticias Multicanal](#10-sistema-de-noticias-multicanal)
11. [Páginas Públicas — Detalle Funcional](#11-páginas-públicas--detalle-funcional)
12. [Dashboard de Miembros](#12-dashboard-de-miembros)
13. [Herramientas de Administrador](#13-herramientas-de-administrador)
14. [Inventario de Server Actions](#14-inventario-de-server-actions)
15. [Inventario de API Routes](#15-inventario-de-api-routes)
16. [Inventario de Componentes](#16-inventario-de-componentes)
17. [Sistema Multi-idioma (i18n)](#17-sistema-multi-idioma-i18n)
18. [Integraciones Externas](#18-integraciones-externas)
19. [Convenciones de Código](#19-convenciones-de-código)
20. [Variables de Entorno](#20-variables-de-entorno)
21. [Flujo de Datos y Patrones](#21-flujo-de-datos-y-patrones)
22. [Quirks y Gotchas Conocidos](#22-quirks-y-gotchas-conocidos)
23. [Stakeholders y sus Interfaces](#23-stakeholders-y-sus-interfaces)

---

## 1. Descripción General

Plataforma web full-stack de **ITEC Saladillo** (Asociación Civil de Ciencia y Tecnología "Augusto Cicaré", Saladillo, Buenos Aires, Argentina). Funciona como hub comunitario que conecta miembros, sponsors, prensa y público general mediante:

- Contenido educativo (noticias multicanal, artículos, videoteca, capacitaciones)
- Gestión de eventos presenciales interactivos (QR, encuestas en vivo, nube de palabras, preguntas al orador, semáforo de comprensión)
- Aula virtual en tiempo real (clases vía Google Meet + herramientas de interacción realtime)
- Asistente virtual con IA (RAG cascade de 5 niveles sobre pgvector)
- Comunicación estratégica multicanal (una noticia → 4 versiones para 4 audiencias, generadas por IA)
- Mapa Productivo (directorio de empresas locales y talento estudiantil)
- Saladillo for Export (testimonios de saladillenses en el mundo, embajadores y gestión admin)
- Portal exclusivo para sponsors con reportes de impacto generados por IA
- Pasaporte Digital (certificados verificables por QR)

La landing incluye streaming en vivo de YouTube y barra inferior de sponsors con marquesina infinita.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router, Turbopack dev) | ^16.3.0 |
| UI | React + React DOM | 19.2.4 |
| Lenguaje | TypeScript (`strict: true`) | ^5 |
| Estilos | Tailwind CSS v4 (via PostCSS) + CSS custom properties | ^4 |
| Animaciones | Framer Motion | ^12.38.0 |
| Iconos | lucide-react | ^1.14.0 |
| Gráficos | Recharts | ^3.8.1 |
| Formularios | react-hook-form + @hookform/resolvers + Zod | ^7.81.0 |
| DB | Supabase PostgreSQL (pgvector para RAG) | supabase-js ^2.105.4, ssr ^0.10.3 |
| Auth | Supabase Auth + Google OAuth (único provider) | — |
| Emails | Resend | ^6.12.3 |
| Fechas | date-fns (con locales es/enUS/pt) | ^4.1.0 |
| Drive API | googleapis | ^171.4.0 |
| IA chat | groq-sdk 1.3.0 (SDK legacy), fetch directo a Groq/OpenRouter/Ollama | — |
| IA genérica | @google/genai (Gemini) | latest |
| Embeddings PDF | pdf-parse / pdf-parse-new | — |
| QR | react-qr-code | ^2.0.21 |
| Despliegue | Vercel (auto-deploy desde `main`) | — |
| Fuente | Inter via `next/font/google` (variable CSS `--font-inter`) | — |

**Path alias:** `@/*` → `./src/*` (configurado en `tsconfig.json`).

---

## 3. Scripts npm

| Script | Comando | Descripción |
|--------|---------|-------------|
| `dev` | `next dev` | Dev server (Turbopack) |
| `build` | `next build` | Build de producción |
| `start` | `next start` | Servidor de producción |
| `lint` | `eslint` | Linting (ESLint 9 flat config + eslint-config-next) |
| `sync-docs` | `node scripts/generateDocsContext.mjs` | Lee PDF/TXT/MD de `/docs` → limpia texto → genera `src/lib/docsContext.ts` (constante `DOCS_CONTEXT`) + `docsContext.json`. Alimenta nivel P2 del RAG. Ejecutar después de subir documentos nuevos. |
| `extract-docs` | `node scripts/extractPdfText.js` | Predecesor simple: extrae texto plano de PDFs a JSON (CommonJS, pdf-parse) |
| `ingest-vector` | `node --dns-result-order=ipv4first --env-file=.env.local scripts/ingestDocsToVector.mjs` | Pipeline pgvector: limpia embeddings previos → chunking 900 chars/overlap 120 → embeddings Gemini `text-embedding-004` (batches de 20, task RETRIEVAL_DOCUMENT) → inserta en tabla `documents` vía REST con service_role |

---

## 4. Estructura del Proyecto

```
D:\ITEC\
├── .github/workflows/deploy.yml # CI/CD: deploy a Vercel en push a main
├── .env.local                   # Variables de entorno (gitignored, única env file)
├── docs/                        # Corpus institucional (PDFs 2023: Expo ITEC, ordenanza,
│                                #   educación, guías de entrenamiento IA) → alimenta RAG
├── public/
│   ├── cicare/                  # 13 fotos JPG de Augusto Cicaré (Cache-Control immutable 1 año)
│   └── sponsors/blanco/         # 27 logos PNG monocromos de sponsors (marquesina landing,
│                                #   carga local vía fs + unstable_cache 1h)
├── scripts/                     # generateDocsContext.mjs, extractPdfText.js,
│                                #   ingestDocsToVector.mjs, test_rag.ts
├── scratch/                     # ~38 scripts de prueba/diagnóstico (IGNORADO por git):
│                                #   test-db.js, test-eventos.js, diagnose-*.js, query_*.js,
│                                #   update_latest_videos.js, analyze_videos.mjs, etc.
├── sponsors/color/              # Logos a color originales (fuente antes de subir a Storage)
├── src/
│   ├── app/                     # App Router (ver detalle abajo)
│   ├── components/              # Ver inventario completo en §16
│   │   └── saladillo-export/    # SaladilloExportSection (embajadores + testimonios)
│   ├── contexts/LanguageContext.tsx  # Contexto React i18n (es/en/pt)
│   ├── lib/                     # Utilidades core (supabase, rag, eventos, email, settings…)
│   ├── locales/dictionary.ts    # Diccionario ES/EN/PT (~1100 líneas, 16 secciones/idioma)
│   ├── proxy.ts                 # Middleware Next.js 16 (reemplaza middleware.ts)
│   ├── services/                # Capa de servicios (auth, ai, admin, news, drive, videos…)
│   └── types/database.ts        # Tipos sincronizados con schema Supabase (~493 líneas)
├── supabase/migrations/         # 71+ archivos SQL (001 → 071 + fix_storage_policies.sql)
├── AGENTS.md                    # Advertencia breaking changes Next.js 16
├── CLAUDE.md                    # Solo "@AGENTS.md" (referencia)
├── ITEC_CODEGUIDE.md            # Esta guía
├── next.config.ts               # Imágenes, headers cache, optimizePackageImports
├── vercel.json                  # maxDuration 60s para /api/asistente
├── tsconfig.json                # strict, target ES2017, alias @/*
├── eslint.config.mjs            # Flat config ESLint 9 + next/core-web-vitals + TS
└── postcss.config.mjs           # Plugin único @tailwindcss/postcss (Tailwind v4)
```

### Árbol completo de `src/app`

**47 archivos page.tsx · 2 layouts · 15 route handlers · 19 archivos `'use server'`.**
No existen `loading.tsx`, `error.tsx`, `not-found.tsx` ni `template.tsx` en ninguna parte.

#### Raíz y rutas públicas

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/` (`page.tsx`) | Server, `force-dynamic`, `revalidate = 0` | Landing principal. NO consulta Supabase: lee logos de `public/sponsors/blanco/` vía fs cacheado con `unstable_cache` (1h). Secciones cargadas con `next/dynamic`. |
| `/acceso-pendiente` | Server estático | Pantalla informativa para usuarios autenticados sin membresía activa. |
| `/articulo` | Server | Índice que solo hace `redirect('/#impacto')`. |
| `/articulo/[slug]` | Server + client | Artículo público con `generateMetadata` dinámico (SEO/OpenGraph). Delega en `ArticleDetailClient`. |
| `/capacitaciones/[id]` | Server, `force-dynamic` | Detalle de capacitación mobile-first: player YouTube embebido, badge LIVE si `is_live`, componente `LivePoll`. Tabla `trainings`. |
| `/certificados/[codigo]` | Server | Verificador público de certificados por código único. `generateMetadata` condicional (noindex si inválido). Renderiza `CertificadoViewer`. Tabla `certificados_digitales`. |
| `/clases/[id]` | **Client** (1213 líneas) | Aula virtual completa realtime: chat, modómetro, mano alzada, preguntas votables, encuestas y semáforo de comprensión. Roles alumno/profesor. Usa las 14 server actions de `actions.ts`. |
| `/eventos/[id]` | **Client** (1573 líneas) | App del asistente presencial: registro/acreditación, encuestas en vivo, preguntas con likes, nube de palabras, voto semáforo. |
| `/eventos/[id]/nube` | Client | Envío de UNA palabra (máx. 20 caracteres) a la nube activa. Anti-duplicado por `dispositivoId` localStorage. |
| `/eventos/[id]/pantalla` | Client (994 líneas) | Pantalla gigante unificada: alterna modos bienvenida/nube/encuestas/preguntas según `modo_pantalla_gigante`; muestra QR y estado del semáforo. |
| `/eventos/[id]/pantalla-nube` | Client | Proyección de nube de palabras en vivo con QR lateral. |
| `/eventos/[id]/pantalla-preguntas` | Client | Ranking de preguntas aprobadas por likes, tiempo real, QR hacia `/preguntar`. |
| `/eventos/[id]/preguntar` | Client | Los asistentes envían preguntas (máx. 250 chars) y dan like (persistido en localStorage). |
| `/login` | Server | Solo se muestra ante error OAuth (`searchParams error/desc/logout`). El login se dispara desde el Navbar/MembersAccessButton. |
| `/mapa-productivo` | Server estático (385 líneas) | Landing informativa del programa: beneficios empresas/alumnos, estadísticas, CTA a `/registro-mapa`. Contenido hardcodeado. |
| `/muro` | Server, `force-dynamic` | Muro público multicanal vía `getAllMulticanalNewsFlashes()`: filtra flashes por audiencia (miembros/sponsors/medios solo si hay sesión). Renderiza `NewsWallMulticanal`. |
| `/registro-mapa` | **Client** (740 líneas) | Formulario dual de inscripción: perfil empresa o alumno (catálogos hardcoded). Inserta en `mapa_empresas` / `alumnos_talentos`. |
| `/socios` | Server, `revalidate = 3600` | Página pública "Nuestros Socios": sponsors + alianzas estratégicas + canales de difusión vía `getSociosData()` (RPC `obtener_socios_publicos`). |
| `/sponsors/[id]` | Server, `force-dynamic`, noindex | Portal privado del sponsor (acceso por token): datos, último reporte de impacto IA, acciones vinculadas e invitaciones por rubro. |
| `/votar` | Server wrapper + `VotingClient` (client) | Busca encuesta activa (`polls.is_active=true`) y permite votación pública en tiempo real. |

#### Dashboard (`src/app/dashboard/`)

`layout.tsx` (Server): guard de sesión con `getCurrentMember()`/`isAdmin()`, sidebar persistente (nav miembro + herramientas admin con submenús `<details>` colapsables), badge de ideas pendientes (conteo tabla `ideas`).

| Ruta | Guard | Funcionalidad |
|------|-------|---------------|
| `/dashboard` | — | Solo redirecciones: sin sesión→`/login`, no activo→`/acceso-pendiente`, resto→`/dashboard/muro`. |
| `/dashboard/ai` | admin/coordinador | Procesador IA: transcripción → resumen + tareas + flash (`processTextAction`). |
| `/dashboard/certificados` | miembro activo | "Pasaporte de Habilidades Digitales": diplomas interactivos con QR (búsqueda `ilike` por nombre en `certificados_digitales`). |
| `/dashboard/comunicacion` | admin, `force-dynamic` | Centro de comunicación estratégica: tabs creación + lista de notas multicanal. |
| `/dashboard/drive` | miembro activo | Explorador Google Drive por comisión (mapeo slug→folder + carpeta general configurable). |
| `/dashboard/encuestas` | admin | CRUD y gestión en vivo de encuestas (`PollManager`). |
| `/dashboard/encuestas/analytics` | admin | Analíticas históricas con Recharts (`AnalyticsClient`). |
| `/dashboard/encuestas/[id]/pantalla` | — | Pantalla de proyección de resultados en vivo (`PresentationClient`). |
| `/dashboard/entrenamiento-asistente` | admin | Entrenamiento del asistente: system prompt + gestión de documentos Storage (upload/delete/list/sync). |
| `/dashboard/eventos` | admin | "Sistema de Preguntas al Orador": lista de eventos para moderar/proyectar/compartir. |
| `/dashboard/eventos/[id]/moderacion` | Client (rol check client-side) | Consola de moderación de preguntas en tiempo real (aprobar/borrar). |
| `/dashboard/eventos-presenciales` | sesión | CRUD de eventos presenciales con QR (`EventosPresencialesClient`). |
| `/dashboard/eventos-presenciales/[id]` | sesión | Panel en vivo del orador (`PanelOradorClient`): switches de herramientas grid 2x2, modo pantalla gigante, concepto de charla, panel semáforo con reinicio. |
| `/dashboard/ideas` | miembro activo | Buzón de ideas: listar, cambiar estado/borrar (admin) (`IdeasManagementClient`). |
| `/dashboard/miembros` | miembro activo (UI según rol) | Gestión de membresías: aprobaciones, roles, comisiones, directorio con stats (`MemberManagementTable`). |
| `/dashboard/muro` | miembro activo | Muro interno (`notas_miembros` publicadas mapeadas a formato multicanal). |
| `/dashboard/nubes` | admin | Gestión de nubes de ideas por evento (reutiliza `EventListClient` con `mode="nubes"`). |
| `/dashboard/perfil` | sesión | Edición de datos personales y avatar (sube a bucket `avatars`). |
| `/dashboard/prensa` | admin | ABM de medios de prensa + envío gacetillas (`MediosAdmin`, `MedioForm`). |
| `/dashboard/prensaNews` | **Client** (sin guard server) | Notas de prensa: crear, enviar gacetilla a medios (modal), historial de envíos. |
| `/dashboard/reuniones` | miembro activo | Sala de reuniones general: enlace Meet persistente (`site_settings.general_meet_url`), acta colaborativa del día (`meeting_notes`) con guardado, procesamiento IA y publicación (`GeneralMeetingRoom`), historial. |
| `/dashboard/saladillo-for-export` | miembro activo | Gestión de testimonios "Saladillo for Export": aprobar/rechazar, asignar embajadores (posición 1–4), crear testimonios (admin), eliminar. CRUD completo con `SaladilloForExportClient`. |
| `/dashboard/settings` | admin | Ajustes del sitio (identidad visual) + gestión API keys (`site_settings` + `api_settings`) con prioridad sobre env vars. |
| `/dashboard/sponsors` | admin | Administración integral: sponsors comerciales, socios estratégicos (`strategic_partners`), acciones del período, generación de reportes IA. |
| `/dashboard/sponsorsNews` | **Client** | Muro exclusivo sponsors (`GET /api/sponsors-news`) + alta rápida de socio. |
| `/dashboard/streaming` | admin/coordinador | Centro de transmisión: toggle ON/OFF, URL YouTube, setup OBS, link Meet (`NEXT_PUBLIC_MEET_LINK`). Persiste en `api_settings`. |
| `/dashboard/videoteca` | admin/coordinador | ABM videos públicos + generación resúmenes IA (`generateVideoSummaryAction`). |

#### API Routes (`src/app/api/` + `src/app/auth/`)

Ver inventario completo con métodos, inputs y tablas en **§15**.
⚠️ **Ninguna declara `runtime = 'edge'`** → todas usan Node.js runtime por defecto.

---

## 5. Configuración de Build y Despliegue

### `next.config.ts`
- `compress: true` (gzip/brotli).
- **Imágenes:** formatos AVIF/WebP, TTL mínimo 30 días, remotePatterns para Supabase (hostname derivado dinámicamente de `NEXT_PUBLIC_SUPABASE_URL` + wildcards `**.supabase.co/.in`).
- **Headers cache:** `/cicare/:path*` y todas las imágenes estáticas → `Cache-Control: public, max-age=31536000, immutable`.
- `experimental.optimizePackageImports: ['lucide-react', 'date-fns', 'framer-motion']`.

### `vercel.json`
```json
{ "functions": { "src/app/api/asistente/route.ts": { "maxDuration": 60 }, "src/app/api/news/process/route.ts": { "maxDuration": 60 } } }
```
Dos funciones con timeout extendido: el asistente IA (RAG + multi-provider) y procesamiento de noticias multicanal (4 versiones en paralelo).

### CI/CD (`.github/workflows/deploy.yml`)
- Trigger: push a `main`.
- Job único ubuntu-latest, Node 20: checkout@v4 → setup-node@v4 → `amondnet/vercel-action@v25 --prod` con secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- ⚠️ No hay pasos de lint/test/build previos (Vercel compila al desplegar). No existen workflows de CI ni preview.

### TypeScript / ESLint / PostCSS
- `tsconfig.json`: target ES2017, `strict: true`, `noEmit`, moduleResolution `bundler`, JSX react-jsx, incremental, plugin Next.js.
- `eslint.config.mjs`: flat config (ESLint 9) con `defineConfig`, extiende `core-web-vitals` + `typescript`.
- `postcss.config.mjs`: único plugin `@tailwindcss/postcss` (Tailwind v4 — usar `@import "tailwindcss"`, NO directivas `@tailwind` de v3).

### Estilos globales (`globals.css`, ~272 líneas)
Tema oscuro como default y único (sin toggle). Keyframes definidos: `marquee-left` (marquesina sponsors), `float`, `pulse-glow`, `gradient-shift`, `fade-up`, `fade-in-out`, `spotlight-ltr`, `spotlight-rtl`, `spin-slow`, `slide-up`, `blink`, `pulse-glow-light`. Clase `.animate-marquee-infinite` (63s default, sobrescrita inline) y `.itec-lang-btn` (FAB selector idioma).

---

## 6. Autenticación y Autorización

### Proxy middleware (`src/proxy.ts`)
Next.js 16 **reemplaza `middleware.ts` por `proxy.ts`**: exporta `proxy(request)` en lugar de `middleware(request)` (mismo contrato Edge). Lógica en orden:

1. **Interceptor código OAuth (workaround):** si la URL trae `?code=` y el path NO es `/auth/callback` (por Site URL mal configurado en Supabase), redirige a `/auth/callback?code=...&state=...`.
2. Crea cliente Supabase edge (`createServerClient` de `@supabase/ssr` leyendo cookies del request); en `setAll` propaga cookies refrescadas al request y a la respuesta. Luego `supabase.auth.getUser()` valida/refresca sesión.
3. **Rutas protegidas** (`PROTECTED_ROUTES = ['/dashboard']`, match exacto o prefijo):
   - Sin usuario → redirect `/login?redirectTo={pathname}`.
   - Con usuario → consulta `members` (role, status): si no existe o `status !== 'activo'` → redirect `/acceso-pendiente`.
   - Si pathname exacto `/dashboard` y activo → redirect `/dashboard/muro`.
4. **Rutas solo-auth** (`AUTH_ONLY_ROUTES = ['/login', '/register']`): si ya hay sesión → redirect `/dashboard`.
5. **`config.matcher`:** excluye `_next/static`, `_next/image`, favicon, imágenes, y **excluye explícitamente `api/chat` y `api/asistente`** (los endpoints del asistente corren sin este gate).

Nota: el rol se consulta pero NO se usa para autorización granular en el proxy — esa distinción ocurre dentro de páginas/actions via `getCurrentMember()`/`isAdmin()`.

### Flujo OAuth
1. Login dispara `supabase.auth.signInWithOAuth({ provider: 'google' })` desde Navbar o `MembersAccessButton`.
2. Callback en `/auth/callback/route.ts` (GET): maneja errores en query, intercambia `code` por sesión, verifica `status` del miembro en `members` (pendiente → signOut + home; activo → `/dashboard/muro`).
3. Signout: POST `/auth/signout` → redirige a `/login?logout=true`.

### Pre-aprobación y trigger DB
- Los emails deben estar en tabla `allowed_emails` para auto-aprobarse; si no, quedan `status = 'pendiente'`.
- **Trigger `handle_new_user()`** en Postgres: al crear usuario en `auth.users`, crea registro en `members`, verifica `allowed_emails`, asigna rol y comisión automáticamente. No permite auto-asignación de roles.
- No hay login por contraseña. Solo Google OAuth.

### Roles y permisos

| Rol | Acceso | Restricciones |
|-----|--------|---------------|
| `admin` | Total | Acceso completo a todas las herramientas |
| `coordinador` | Amplio | Similar a admin, limitado a su comisión |
| `miembro` | Básico | Muro, perfil, drive, reuniones, ideas, certificados, aula virtual |
| `colaborador` | Restringido | Solo lectura en áreas específicas |

### Servicios de auth (`src/services/auth.ts`)
- `getCurrentMember(): Promise<Member | null>` — usuario autenticado + fila en `members` en una sola llamada. Usar SIEMPRE esta función en Server Components/Actions.
- `hasRole(member, roles)` — verifica pertenencia a lista de roles.
- `isAdmin(member)` — shortcut para rol `admin`.

---

## 7. Seguridad

### Patrón obligatorio de Server Actions
```typescript
const member = await getCurrentMember()
if (!member || !['admin', 'coordinador'].includes(member.role)) {
  return { success: false, error: 'No autorizado' }
}
```
Todas las actions administrativas verifican `getCurrentMember()` antes de ejecutar. Validación de inputs con Zod.

### Row-Level Security (RLS)
- Todas las tablas críticas usan políticas RLS basadas en `auth.uid()` y rol en `members`.
- **Migración 056 (hardening crítico):** corrigió políticas permisivas en `clases_virtuales`, `clase_interacciones`, `certificados_digitales` (antes `USING(true)` permitía CRUD anónimo). Escritura restringida a admin/coordinador.
- **Migración 071 (saladillo_for_export):** SELECT público solo para registros aprobados; INSERT público permitido (estado por defecto 'pendiente'). Storage bucket `saladillo-export-photos` público para lectura y escritura.
- Tablas de interacción en vivo de clases (migración 060: `clase_modometro_votos`, `clase_mano_alzada`, etc.) tienen RLS abierta a propósito (interacción anónima realtime).
- `evento_semaforo_votos`: SELECT e INSERT públicos; sin UPDATE/DELETE (votos inmutables, append-only).

### Storage
- **Buckets:** `article-media`, `avatars`, `training-docs`, `sponsors-logos`, `saladillo-export-photos` (todos públicos para lectura).
- `sponsors-logos`: SELECT público; INSERT autenticado admin/coordinador. Políticas en `fix_storage_policies.sql`.
- `saladillo-export-photos`: SELECT público; INSERT público (formulario de creación de testimonios).

### Identificación anónima por dispositivo
- Eventos presenciales y aula virtual identifican usuarios por UUID en `localStorage` (`dispositivo_id`), sin login.
- **Semáforo de comprensión:** dedup SERVER-SIDE por dispositivo — migración 057 agregó columna `dispositivo_id TEXT` + índice `(evento_id, dispositivo_id, created_at)`. La action `registrarVotoNegativo(eventoId, dispositivoId)` verifica que el dispositivo no haya votado en el ciclo actual (desde `semaforo_last_reset_at`) antes de insertar. Un dispositivo = un voto por ciclo. Cooldown adicional de 5s solo client-side.
- Encuestas usan cookie-based dedup (`livepoll_voted_{pollId}`, httpOnly, 24h) en `voteLivePollAction()`.
- Nube de palabras: límite de caracteres (20 en móvil, 25 genérico) + anti-duplicado por dispositivo en localStorage.

### Seguridad de la IA
- **Auditoría post-respuesta** (`auditarRespuestaIA()` en `services/ai.ts`): 4 categorías regex:
  1. Mención de "Peques ITEC" → **solo monitoreo/log (ago 2026)**. El prompt maestro define el programa como público y difundible; la regla anterior (gravedad alta que reemplazaba TODA la respuesta por una negativa genérica) era la causa principal de las negativas frecuentes del asistente
  2. Exposición de rutas internas del sistema → **redacta solo la ruta detectada** con "Sección interna del sitio ITEC" (antes anulaba toda la respuesta)
  3. Lenguaje informal/regionalismos fuera de tono ("che", "viste", "pibe") → solo log
  4. Palabras temporales relativas ("hoy", "ayer", "mañana") → solo log — el prompt maestro ya indica los reemplazos correctos
- Violaciones registradas en `ai_auditoria_violaciones` para monitoreo.
- ⚠️ Lección arquitectónica: no agregar reglas de reemplazo total de respuesta que contradigan el prompt maestro de la DB. Las fuentes institucionales (`ai_prompt_settings`) son la autoridad sobre qué información es pública.
- **No se exponen API keys al cliente**: llamadas IA solo server-side/API routes. Errores de providers sanitizados (solo códigos de estado logueados).

### Tokens y credenciales
- Supabase anon key (pública): lectura filtrada por RLS.
- Service role key: solo server-side (API routes del asistente/chat, comunicacion actions).
- Sponsors `private_token`: UUID único por sponsor para su portal privado; no expuesto en URLs públicas (portal es `/sponsors/[id]`, noindex).
- Google Service Account JSON: almacenado en `site_settings.google_service_account_json` (NO en .env) para rotación sin redeploy.
- API keys rotatables en tabla `api_settings` con prioridad sobre env vars (ver §9.9).

### Recomendaciones para nuevos desarrollos
1. Nunca exponer API keys/secrets en cliente o localStorage.
2. Siempre `getCurrentMember()` en Server Actions antes de mutar.
3. Usar RLS en tablas nuevas; no confiar solo en validación de app.
4. Auditar endpoints públicos que aceptan input de usuario.
5. No deshabilitar RLS en migraciones sin aprobación explícita.
6. Loggear accesos no autorizados en `ai_auditoria_violaciones` o similar.

---

## 8. Base de Datos (Supabase)

### 8.1 Clientes Supabase — 3 patrones coexisten

| Archivo | Uso | Detalle |
|---------|-----|---------|
| `src/lib/supabase/server.ts` | Server Components/Actions | `createServerClient` de `@supabase/ssr` ligado a `cookies()` de `next/headers`. **Asíncrono: siempre `await createClient()`**. En `setAll` captura silenciosamente el error en Server Components (confía en refresh del proxy). |
| `src/lib/supabase/client.ts` | Client Components | `createBrowserClient` síncrono con env vars públicas. |
| Cliente crudo `@supabase/supabase-js` | Casos especiales | En `lib/data/socios.ts` y `services/videos.ts` (este último importa el browser client aunque lo usan páginas admin) y en `/api/asistente` + `/api/chat` (admin client con service_role, sin cookies). |

⚠️ Al crear clientes nuevos, preferir los patrones de `lib/supabase/`. No mezclar sin motivo.

### 8.2 Tablas por dominio

#### Core
| Tabla | Descripción | Campos clave |
|-------|-------------|--------------|
| `members` | Perfiles de usuario | `id(uuid PK→auth.users)`, `full_name`, `email(UNIQUE)`, `avatar_url`, `role`(admin\|coordinador\|miembro\|colaborador), `status`(activo\|inactivo\|pendiente), `bio`, `linkedin_url`, `phone`, `join_date`, `frase_itec`, `tareas_itec` |
| `commissions` | Grupos de trabajo | `name`, `slug(UNIQUE)`, `description`, `icon`, `color`, `is_active`, `coordinator_id(FK→members)`, `meet_link`, `drive_folder_id` |
| `commission_members` | Relación m-c | Unique(commission_id, member_id), `is_coordinator` |
| `allowed_emails` | Pre-aprobados | `email(UNIQUE)`, `role`, `commission_id` |
| `site_settings` | Config global clave-valor | Google service account JSON, `google_drive_root_id`, `general_meet_url` (col. desde mig. 061) |
| `api_settings` | API keys rotatables (mig. 058) | `key/value`, RLS CRUD solo admins, índice `idx_api_settings_key` |

#### Noticias y Comunicación Multicanal
| Tabla | Descripción |
|-------|-------------|
| `news_flashes` | Tabla principal: `titulo`, `commission_id`, `author_id`, `original_text`, `summary`, `flash_text`, `source_type`, `is_published`, `tags`, `texto_publico`, `texto_miembros`, `texto_sponsors`, `texto_medios`, `datos_crudos`, `para_publico`, `para_miembros`, `para_sponsors`, `para_medios`, `media_urls(jsonb)` |
| `notas_publico` / `notas_miembros` / `notas_sponsors` / `notas_medios` | Una tabla por canal (contenido adaptado por IA) |
| `notas_generadas` | Notas generadas por IA |
| `public_articles` | Artículos con slugs, `related_video_id` (mig. 022), `news_flash_id` (mig. 040) |
| `news_comments` | Comentarios (soft delete), FK `news_flash_id` |
| `news_media` | Multimedia adjunto |

⚠️ Las actions de comunicación escriben en tabla dinámica según canal (`notas_publico`/`notas_miembros`/`notas_sponsors`/`notas_medios`).

#### Acciones de Impacto
| Tabla | Descripción |
|-------|-------------|
| `itec_actions` | Acciones (capacitacion\|evento_social\|divulgacion) con `title`, `description`, `type`, `status`, `target_audience`, `capacity`, `cost`, fechas, `location`, `thumbnail_url`, `tags(text[])`, `responsible_id`, `commission_id`, `materials_urls(text[])`, `media_urls(text[])`. ⚠️ En algunos módulos se referencia como `acciones_itec` (ver gotchas §22) |
| `action_registrations` | Inscripciones públicas a acciones |

#### Eventos Presenciales
| Tabla | Descripción |
|-------|-------------|
| `eventos` | `herramientas_activas`(JSONB: `encuestas`,`preguntas`,`nube`,`semaforo` booleans), `modo_pantalla_gigante`, `semaforo_last_reset_at`, `nube_concepto TEXT DEFAULT ''` (mig. 055), `modalidad`(presencial\|virtual, mig. 059), `meet_url` (mig. 060) |
| `eventos_asistentes` | Acreditados (unique evento+email tolerante, upsert en registro) |
| `eventos_encuestas` / `eventos_encuestas_opciones` / `eventos_encuestas_votos` | Encuestas en vivo del evento |
| `eventos_preguntas` / `evento_preguntas_likes` | Preguntas con sistema de likes |
| `evento_preguntas_colaborador` | Colaboración en preguntas |
| `evento_nubes` / `evento_nube_palabras` / `eventos_nube_palabras` | Nubes múltiples por evento. ⚠️ Conviven singular/plural (ver gotchas §22) |
| `evento_semaforo_votos` | Semáforo v3 (mig. 054) + `dispositivo_id` (mig. 057): solo `id`, `evento_id`, `dispositivo_id`, `created_at`. Cada fila ES un voto negativo. Append-only. Publicada en `supabase_realtime` |

#### Clases Virtuales (Aula Virtual — migración 060 "esquema híbrido")
| Tabla | Descripción |
|-------|-------------|
| `clases_virtuales` | Sesiones: `modalidad`(presencial\|virtual), `meet_url`, estado streaming/en vivo (`en_vivo` desde mig. 025) |
| `clase_modometro_votos` | Ritmo de clase: voy_bien/me_perdi/muy_rapido |
| `clase_mano_alzada` | Cola de turno de palabra (atender/bajar) |
| `clase_preguntas` + `clase_pregunta_votos` | Q&A votable con `votos_count`, `resuelta` |
| `clase_encuestas` + `clase_encuesta_respuestas` | Encuestas de clase (opciones JSONB) |
| `clase_semaforo_votos` | Semáforo verde/amarillo/rojo de comprensión |
| `clase_interacciones` | Interacciones genéricas (chat, mano alzada legacy) |

Todas las tablas realtime de clase están en publicación `supabase_realtime`. RPCs: `reiniciar_semaforo_clase(uuid)`, `toggle_pregunta_voto(uuid, uuid, text)`.

#### Encuestas Globales
`polls` → `poll_questions` → `poll_options` → `poll_votes`. Campo `chart_type` (mig. 018). `trainings` puede tener polls propios (LivePoll de capacitaciones).

#### Certificados y Capacitaciones
| Tabla | Descripción |
|-------|-------------|
| `certificados_digitales` | `codigo(UNIQUE)`, `titulo`, `alumno_nombre`, `fecha`, `competencias(text[])`, `horas_catedra`, `thumbnail_url`. SELECT público (verificación), escritura solo admin (mig. 056) |
| `trainings` | Capacitaciones: `youtube_url`, `is_live`, status |
| `entrenamiento_acciones` | Acciones vinculadas a entrenamientos |

#### Sponsors y Socios
| Tabla | Descripción |
|-------|-------------|
| `sponsors` | `tier`(platino\|oro\|plata\|bronce\|standard — constraint actualizado mig. 065), `rubro`, `resena`, contactos, `logo_monocromo_url`, `logo_color_url` (ambas mig. 065), `private_token(UNIQUE)`, `type TEXT DEFAULT 'SPONSOR'` (mig. 068: SPONSOR\|STRATEGIC_ALLIANCE\|DIFFUSION_CHANNEL) |
| `strategic_partners` (mig. 067) | Socios estratégicos: `category`(institucion_educativa\|organismo_publico\|ong\|empresa_aliada\|otro), `actions_description NOT NULL`, `logo_url NOT NULL`, `is_active`. RLS: SELECT público solo activos; escritura solo admin. Trigger `strategic_partners_updated_at` |
| `sponsor_reportes` (+ `sponsor_reportes_acciones`) | Reportes de impacto IA |
| `medios_prensa` | Medios registrados (también usados como canales de difusión, mig. 039 `media_urls`) |
| `prensa_envios_log` | Historial de envíos de gacetillas (estado, destinatario, errores) |

#### IA y Asistente
| Tabla | Descripción |
|-------|-------------|
| `ai_prompt_settings` | System prompts dinámicos keyed por `clave_prompt` (ej. `asistente_global`, `sponsor_report_mensual`). Lecturas cacheadas con `unstable_cache` (600s, tag `ai-prompt-settings`) |
| `ai_auditoria_violaciones` | Violaciones de auditoría IA |
| `asistente_feedback` | Calificaciones (muy_util/util/no_util/error) + embeddings |
| `asistente_aprendizajes` | Patrones aprendidos |
| `asistente_embeddings` | Embeddings vectoriales |
| `saved_conversations` | Conversaciones guardadas con embedding (búsqueda semántica P4, threshold 0.35, solo misma sesión) |
| `chat_conocimiento` | Knowledge base de conversaciones (tipo `autogestion`) |
| `documents` (pgvector, mig. 062+063) | Schema canónico: `id bigint identity`, `file_path`, `chunk_content`, `embedding vector(768)`, `created_at`. Índice HNSW cosine. RPC `match_documents(query_embedding, match_threshold, match_count)` (LANGUAGE sql, similitud `1 - <=>`). RLS: SELECT público; escritura vía service_role |
| `training_docs` | Documentos de entrenamiento (Storage bucket) |

#### Otros
| Tabla | Descripción |
|-------|-------------|
| `ideas` | Buzón de ideas (RPC `insert_idea`, estados, votos) |
| `videos` | Videoteca YouTube: `display_order`, `ai_summary`, thumbnail recalculado |
| `meeting_notes` | Actas colaborativas de la Sala de Reuniones (nota activa del día + historial publicado) |
| `mapa_empresas` (+ `mapa_empresas_telefono`) / `alumnos_talentos` | Mapa Productivo |
| `saladillo_for_export` (mig. 071) | Testimonios "Saladillo for Export": `nombre`, `foto_url`, `ciudad_residencia`, `pais_residencia`, `escuela_origen`, `profesion_rol`, `mensaje_gratitud`, `es_embajador` (bool), `orden_embajador` (1–4), `estado` (pendiente\|aprobado\|rechazado). RLS: SELECT solo aprobados; INSERT público. Storage bucket `saladillo-export-photos` (público). |

### 8.3 RPCs principales
| RPC | Propósito |
|-----|-----------|
| `handle_new_user()` (trigger) | Alta automática de member al registrarse |
| `obtener_miembros_publicos` | Miembros para landing — NO retorna email ni phone (PII protegida, mig. 028/031/032) |
| `obtener_sponsors_publicos` (mig. 066, deprecated por 068) | Campos seguros de sponsors activos (sin `private_token` ni `contacto_telefono`) |
| `obtener_socios_publicos` (mig. 068) | **RPC unificado actual**: UNION ALL de sponsors activos + strategic_partners + medios_prensa normalizados. SECURITY DEFINER, grant anon/authenticated/service_role |
| `match_documents(vector, float, int)` | Búsqueda pgvector cosine (P1 del RAG) |
| `buscar_feedbacks_similares` | Feedbacks semánticamente similares |
| `buscar_conversaciones_similares` | Conversaciones similares P4 |
| `buscar_docs_similares` (mig. 044) | Docs de entrenamiento similares |
| `insert_idea` | Alta idea pública |
| `reiniciar_semaforo_clase` / `toggle_pregunta_voto` | Interacción aula virtual |

### 8.4 Migraciones — historial resumido (71+ archivos SQL, 001→071 + fix_storage_policies.sql)

⚠️ Hay números duplicados (014, 024, 025, 026, 032, 036 tienen dos archivos c/u). No hay carpeta de rollback. Aplicar manualmente en Supabase tras cambios de schema.

| Rango | Tema |
|-------|------|
| 001–010 | Schema inicial, sponsors_reportes, news_flashes, site_settings, admin policies, public_articles, itec_actions, storage buckets, videoteca, video_summary |
| 011–020 | allowed_emails, pre-aprobación completa, Drive credentials/folders, RLS acciones, service account, encuestas v1/v2/chart_type, evento_preguntas, colaboradores |
| 021–030 | Multi-nube, article_related_video, aprendizajes, embeddings asistente, clases+certificados, prompts IA, clases_en_vivo, auditoría IA, sistema eventos QR unificado, avatars, RPC miembros públicos, delete policy, mapa teléfonos |
| 031–040 | Avatar público, más campos públicos, fix email case trigger, news multicanal (+fix), news_comments, news_media, sponsors campos, notas_generadas, titulo news_flashes, media_urls sponsors_medios, news_flash_id articles |
| 041–050 | chat_conocimiento, training_docs storage (+fix policies), buscar_docs_similares, saved_conversations, ideas (+delete policy), prensa_envios_log, evento_semaforo v1, fix modalidad, herramientas JSONB, default false |
| 051–060 | remove_semaforo (053) → **054 semaforo v3** (tabla mínima append-only + reset_at + realtime) → 055 nube_concepto → **056 fix RLS critical** → **057 semaforo dispositivo_id** (dedup server-side) → **058 api_settings** → 059 modalidad eventos → **060 esquema híbrido virtual** (modalidad clases, meet_url, 7 tablas realtime de aula + RPCs + realtime publication) |
| 061–068 | 061 general_meet_url → **062/063 pgvector RAG** (extensión vector, documents, HNSW, match_documents) → **064 streaming config** (keys `streaming_active`/`streaming_youtube_url` en api_settings) → 065 sponsors update (rubro/resena/contactos/logos/tier standard) → 066 RPC sponsors públicos → **067 strategic_partners** → **068 partner_classification** (col. type + RPC unificado obtener_socios_publicos) |
| 069–071 | **071 saladillo_for_export** (tabla testimonios saladillenses en el mundo, embajadores 1–4, RLS SELECT aprobados/INSERT público, storage bucket `saladillo-export-photos`). Integrada en AboutSection landing + admin dashboard. |

---

## 9. Sistema de IA

### 9.1 REGLA DE ORO: Modelos Gratuitos
> Todos los endpoints del asistente DEBEN usar modelos FREE. El proveedor primario es **OpenCode** (`opencode/glm-5-free`). Costo objetivo: $0.

### 9.2 Distribución por proveedor y tarea

| Proveedor | Modelo | Uso |
|-----------|--------|-----|
| **OpenCode** | `opencode/glm-5-free` | **Asistente ITEC primario** (`/api/asistente`). Tier gratuito. Timeout 13s. Endpoint `https://api.opencode.ai/v1/chat/completions`. También usado en `services/ai.ts` para generación de texto (comunicación multicanal). |
| **Groq** | `openai/gpt-oss-20b` | **Asistente fallback** (`/api/asistente`). Tier gratuito/developer. Timeout 13s. `/api/chat` usa el mismo modelo. Multi-key soportado (`GROQ_API_KEY`, `GROQ_API_KEY_2`). |
| **OpenRouter** | `nvidia/nemotron-3.5-lightning:free` | Fallback del asistente. Tier gratuito. Timeout 13s. Headers `HTTP-Referer: https://itecsaladillo.org.ar` + `X-Title: ITEC Asistente`. Multi-key (`OPENROUTER_API_KEY`, `OPENROUTER_API_KEY_2`). Modelos secundarios: `minimax/minimax-m3:free`. |
| **Google Gemini** | `gemini-2.0-flash` | **Último recurso del asistente** (`/api/asistente`, cuarto fallback vía REST v1beta, timeout 18s) + **edición de texto exclusiva** en `services/ai.ts`: resúmenes, flashes, noticias multicanal, resúmenes de video. Rota hasta 4 API keys de `api_settings` con fallback a env `GOOGLE_GENERATIVE_AI_API_KEY`. Env vars tienen prioridad sobre DB. |
| **Google Gemini** | `gemini-embedding-001` | Embeddings primarios (RAG P1 + feedback). |
| **HuggingFace** | `all-MiniLM-L6-v2` | Embeddings fallback (384 dims, zero-padded a 768 para pgvector). |
| **Ollama self-hosted** | `llama3.2:latest` en `OLLAMA_API_BASE_URL` (default `https://ai.itecsaladillo.org.ar`) | Reportes de impacto de sponsors (`sponsorReport.ts`, timeout 98s, `num_ctx: 2048`) + síntesis de tema/feedback (`/api/asistente/feedback`, timeout 98s). NO asumir disponibilidad — siempre hay fallback. |

### 9.3 Servicios (`src/services/ai.ts`, ~661 líneas)
| Función | Propósito |
|---------|-----------|
| `callOpenCode(messages)` | POST OpenCode `opencode/glm-5-free` con `OPENCODE_API_KEY`, timeout 13s |
| `callOpenRouter(messages)` | POST OpenRouter multi-key × multi-modelo (`nemotron-3.5-lightning:free`, `minimax-m3:free`), lanza todas en paralelo, timeout 10s por intento |
| `callGemini(messages, temperature)` | POST Gemini `gemini-2.0-flash` con rotación de 4+ keys (env first, luego DB), todas en paralelo, timeout 25s |
| `processWithAI(text, sourceType, commissionName?)` | `{summary, action_items[]}` desde transcripciones (sourceType: meet\|capacitacion\|reunion\|manual) |
| `generateFlash(text)` | Flash noticioso máx. 2 oraciones para muro interno |
| `generateExecutiveSummary(notes)` / `generateActionItems(notes)` | Wrappers de processWithAI |
| `generateMulticanalNews(rawFacts)` | Titular + 4 textos por audiencia; parsing JSON robusto con fallback textual. **Generación en paralelo** (Promise.allSettled, 1 texto por llamada concurrente a OpenCode) |
| `generateVideoSummary(title, description)` | Resumen periodístico máx. 200 palabras |
| `generarEmbedding(texto)` | Gemini `gemini-embedding-001` → HF fallback (pad 384→768) |
| `buscarFeedbacksSimilares(mensaje, limit, threshold)` | RPC pgvector feedbacks |
| `auditarRespuestaIA(mensajeUsuario, respuestaIA, sessionId?)` | Auditoría 4 categorías regex; reemplaza respuesta si gravedad alta; registra violaciones |

### 9.4 Reportes de Sponsor (`src/services/sponsorReport.ts`, ~253 líneas)
- `generateSponsorReport(data)`: narrativa mensual vía **Ollama** con prompt dinámico de BD (`getAIPrompt('sponsor_report_mensual')`) + fallback local.
- Parsea 4 secciones separadas por `---SECCION---`.
- Si falla: `buildFallbackReport()` con `generado_con_ia: false`.

### 9.5 RAG Cascade (`src/lib/rag/ragCascade.ts`)
Recuperación de contexto en 5 niveles. **Orden de resolución:** P1 → P2 → P3 → P4 → **Soft fallback (fuentes propias aunque estén bajo threshold) → P5 web** (ago 2026: el soft fallback tiene PRIORIDAD sobre la búsqueda web — un documento institucional con score bajo vale más que un resultado genérico de internet).

| Nivel | Fuente | Threshold | Método |
|-------|--------|-----------|--------|
| **P1** | pgvector `documents` | ≥ 0.15 | Embedding Gemini de la query + RPC `match_documents` (cosine, 6 chunks) |
| **P2** | `DOCS_CONTEXT` local (docsContext.ts autogenerado) | ≥ 0.22 | Chunking 900/120 + scoring overlap de tokens estilo Jaccard modificado `|A∩B|/min(|A|,|B|)` con stopwords español |
| **P3** | Bucket Storage `training-docs` (.txt/.md/.json) | ≥ 0.22 | Token overlap. **Caché memoria TTL 5 min (`P3_CACHE_TTL_MS`) + deduplicación de descargas concurrentes** (`p3FetchPromise` compartida + `.finally()`) — anti-stampede |
| **P4** | Conversaciones guardadas del propio sessionId | any | RPC `buscar_conversaciones_similares` (threshold 0.35) |
| **Soft fallback** | Mejor resultado propio bajo threshold | < threshold | Se retorna ANTES de consultar web |
| **P5** | DuckDuckGo Instant Answer + scraping nativo DDG Lite | any | Web search sin API key, query enriquecida con "itec saladillo Cicaré expo itec". Si la Instant Answer no produce ≥80 chars (habitual en español de nicho), hace **scraping HTML de `lite.duckduckgo.com/lite/`** (regex sobre `td.result-snippet`, sin APIs de terceros — AGENTS.md prohíbe Serper) |

⚠️ Thresholds calibrados ago 2026: los originales (0.40 keyword local) descartaban matches útiles y contribuían a negativas del asistente. No subirlos sin medir impacto en respuestas.

- Export: `recuperarContextoRAG(query, supabase, sessionId?)` → `{contexto, nivel, score}`. Contexto máximo 3200 chars (`MAX_CONTEXT_CHARS`), sin etiquetas de fuente. `nivel` solo para logging interno (nunca se expone al LLM).
- Compatible con Edge Runtime (funciones puras, fetch + regex, sin dependencias Node pesadas).
- ⚠️ Para `services/ai.ts` (comunicación multicanal), los timeouts de Gemini son 20s (vs 18s del asistente) para dar margen a prompts de 4 textos generados en paralelo.

### 9.6 Conversaciones Guardadas (`src/lib/rag/conversacionesGuardadas.ts`)
- `detectarComandoGuardar(mensaje)`: regex español ("guardá esta conversación", etc.).
- `debeAutoGuardar(historialLength)`: auto-guardado cada 10 mensajes tras umbral inicial de 10 (`AUTO_SAVE_THRESHOLD=10`, `AUTO_SAVE_INTERVAL=10`).
- `guardarConversacion(...)`: embedding de últimos 20 mensajes → `saved_conversations` (fire-and-forget).
- `buscarConversacionesSimilares(...)`: recuperación semántica P4 restringida a la sesión propia.
- ⚠️ **Persistencia real (ago 2026):** antes el flag `guardado` se marcaba pero nadie persistía nada. Ahora `guardarConversacion()` se ejecuta efectivamente cuando hay comando explícito o auto-guardado, manteniendo el nivel P4 del RAG operativo.

### 9.7 Asistente IA (`POST /api/asistente`)
- **Cadena con reintentos multi-pasada (ago 2026):** los providers se recorren en orden **OpenCode `opencode/glm-5-free` → Groq `openai/gpt-oss-20b` → OpenRouter `nvidia/nemotron-3.5-lightning:free` → Gemini `gemini-2.0-flash`**, y si TODOS fallan se vuelve a recorrer la cadena (pasada 2, 3…) hasta agotar un presupuesto de **48s** (`DEADLINE_MS`) dentro del `maxDuration = 60`. Backoff de 1.2s entre fallos. Los errores transitorios (429/5xx/timeouts/red) se reintenta; los permanentes (**400/401/403/404/413**) deshabilitan al provider por el resto del request. Ante respuestas inválidas (vacías, <10 chars o metadata de seguridad) también se reintenta. La respuesta 502 incluye `{intentos, pasadas, opencode, groq, openrouter, gemini}` para diagnóstico.
- Timeouts por intento: OpenCode/Groq/OpenRouter 13s, Gemini 18s — acotados además por el presupuesto restante (`MIN_PRESUPUESTO_INTENTO` 3s: no se arranca un intento que no pueda terminar dentro del deadline).
- ⚠️ **Los modelos gratuitos rotan frecuentemente** (Groq apagó los Llama en ago 2026; OpenRouter retira slugs :free sin aviso). Si el asistente devuelve "Todos los providers fallaron", diagnosticar SIEMPRE con `GET /api/asistente/debug` (hace ping real a cada provider) y actualizar las constantes de modelos al tope del route.
- `maxDuration = 60` (route export + vercel.json).
- Input: `{ mensaje, historial[], sessionId?, idioma? }`. sessionId default `crypto.randomUUID()`.
- Requiere al menos una key entre GROQ_API_KEY / OPENROUTER_API_KEY / Gemini keys (si no → 500).
- **Contexto en paralelo** (Promise.allSettled con admin client service-role, sin cookies): prompt maestro (`ai_prompt_settings.clave_prompt='asistente_global'`), staff (`obtener_miembros_publicos`), últimas 10 notas públicas, comisiones, acciones, artículos, **RAG cascade completo**.
- **Ensamblado del system prompt con contextos protegidos (ago 2026 — CRÍTICO):**
  1. Prompt maestro (DB de ~7600 chars, o FALLBACK_PROMPT)
  2. `+ contextoAcumulado`: RAG PRIMERO ("Información recuperada para esta consulta") → luego Noticias → Actividades → Artículos (excerpt 250 chars) → Staff → Comisiones
  3. `+ POLITICA_RESPUESTA_INTEGRAL` SIEMPRE al final (máxima precedencia por recencia)
  - `MAX_PROMPT_CHARS = 18000`. Si el total excede el presupuesto, **se trunca SOLO el prompt maestro** (`slice` + `[...]`) — el contexto RAG/DB y la política van NUNCA truncados.
  - ⚠️ Historia: antes se apilaba RAG al final con corte fijo en 10000 chars → el RAG quedaba fuera casi siempre y el asistente se negaba a responder pese a tener datos. Cualquier cambio en este ensamblado debe preservar: contexto completo + política al final + truncamiento solo del maestro.
- `max_tokens: 2048` en Groq/OpenRouter y `maxOutputTokens: 2048` en Gemini. ⚠️ No subir a 4096: prompt (~15k chars ≈ 4k tokens) + completion rozan el límite por-request del tier on_demand de Groq → error 413 "Request too large". Si crece el prompt, bajar MAX_PROMPT_CHARS en lugar de subir max_tokens.
- Detecta comandos de guardado y auto-guarda cada 10 mensajes.
- Post-procesamiento: `auditarRespuestaIA()`.
- ⚠️ Groq free/on-demand tiene límites TPM: ráfagas consecutivas con prompts grandes pueden devolver 429 transitorio — la cadena cae al siguiente provider automáticamente.

### 9.8 Feedback (`POST /api/asistente/feedback`)
Input: `{ historial[{role: user|model, text}], calificacion, comentario? }`.
- Si hay interacción: Ollama sintetiza `{tema_principal, lo_mas_util}` en JSON (timeout 98s; regla de género: nunca "el ITEC"/"la ITEC").
- Embedding vía `generarEmbedding()` (Gemini→HF) y persistencia en `asistente_feedback`.

### 9.9 Constantes de IA (`src/lib/ai/constants.ts`)
- `FALLBACK_PROMPT`: System Prompt Maestro ("Asistente ITEC") — identidad, biografía de Augusto Cicaré, historia Expo ITEC, comisiones, estilo rioplatense técnico-humano-vanguardista, prohibición de inventar datos.
- `ANTI_HALLUCINATION_RULES_STRICT`: responder SOLO con `<retrieved_context>`; si no está, negarse amablemente. Usado por `/api/chat` (legacy).
- `ANTI_HALLUCINATION_RULES_FLEXIBLE`: prioridad retrieved_context → artículos publicados → conocimiento general → recién entonces "no dispongo de esa información". (Reemplazada como regla activa del asistente por la política integral.)
- `POLITICA_RESPUESTA_INTEGRAL` (ago 2026): **regla activa de `/api/asistente`**, va al FINAL del system prompt. Prohíbe negarse a responder si existe cualquier material relacionado en el contexto (RAG + DB), obliga a responder con lo más útil disponible, permite rechazar solo temas totalmente ajenos a ITEC/Cicaré/ecosistema, y mantiene la prohibición de inventar fechas/precios/normativas. Fue creada para eliminar las negativas frecuentes ("no cuento con información sobre ese tema") causadas por guardrails estrictos del prompt maestro combinados con contexto truncado.

### 9.10 Resolución de API keys (`src/lib/settings.ts`)
`getSettingValue(key, envVarName?)`: estrategia **fallback híbrido DB → env**: consulta `api_settings` (clave/valor); si vacío/inexistente → `process.env[envVarName]`. Caché Map a nivel de módulo. Es la base de resolución de Gemini (×4 keys), HF, Resend, streaming config. El dashboard de settings admin gestiona estas claves con prioridad sobre env vars.

---

## 10. Sistema de Noticias Multicanal (Feature Central)

Flujo completo:
1. **`NewsFlashMulticanalEditor`** (client) — editor recibe datos crudos y llama `createMulticanalNewsAction` o `POST /api/news/process`.
2. **IA** (`generateMulticanalNews()` en `services/ai.ts`, Gemini `gemini-flash-latest`) — genera titular + 4 textos para 4 canales con prompts detallados por audiencia.
3. Persistencia en `news_flashes` (campos `texto_publico`, `texto_miembros`, `texto_sponsors`, `texto_medios`, flags `para_*`) + registros en `notas_publico`/`notas_miembros`/`notas_sponsors`/`notas_medios` (tabla dinámica según canal).
4. **Distribución:**
   - **Público** → `/muro` (visible para todos)
   - **Miembros** → `/dashboard/muro` (requiere sesión activa; en `/muro` también visible si hay sesión)
   - **Sponsors** → portal sponsor + `GET /api/sponsors-news`
   - **Medios** → gacetillas + `GET /api/press-news` + email via Resend
5. **Visualización:** `NewsWallMulticanal` (tabs por canal, slideshow de medios con aspect ratio original preservado: `object-contain` max-h-280px sobre fondo oscuro).
6. **Gestión:** `NotasMulticanalList` — editar, borrar, publicar/despublicar, **reordenar** (`swapNotasOrderAction`).

Servicio de lectura (`src/services/news.ts`):
- `getAllMulticanalNewsFlashes()`: merge de `news_flashes` + `notas_publico` (+ `notas_miembros` si hay sesión), normaliza campos legacy, ordena por fecha.
- `getPublicArticles()` / `getArticleBySlug(slug)`: resolución tolerante de `media_urls` (array o string JSON); slug acepta UUID con fallback a `notas_publico` y luego `news_flashes`.

---

## 11. Páginas Públicas — Detalle Funcional

### Landing (`/`)
Secciones (server component carga con `next/dynamic`): Hero, About, Impact, Comisiones, Ideas, Videoteca, Footer, Nuestros Socios, Saladillo for Export.

Características clave:
- **Hero** (`HeroSection.tsx`, client): logo + galería fotos Cicaré + frase aleatoria de 3 opciones. Si hay clase con `en_vivo=true` en `clases_virtuales` (Realtime), botón "Aula Virtual" en rojo pulsante.
- **Streaming en vivo:** si `streaming_active=true` + `streaming_youtube_url` en api_settings, el Hero muestra `StreamingPlayer` (convierte cualquier URL YouTube — watch/youtu.be/embed/shorts/live— a iframe embed autoplay+mute) en lugar de las palabras spotlight. Estado consultado vía `/api/streaming/status` (cache 30s).
- **Barra sponsors marquesina** (`SponsorHeaderBar.tsx`): fija al borde inferior, logos monocromos de `public/sponsors/blanco/` leídos del filesystem en el server (`getSponsorLogos` con `unstable_cache` 1h, timestamp mtime como cache-buster `?v=`). Loop infinito: `MARQUEE_COPIES = 2` copias memoizadas (`useMemo`) + `translateX(-50%)`, duración inline 70s, pausa al hover, fade out al scroll > 10px, `loading="lazy"` + `decoding="async"`. Fallback a placehold.co si carpeta vacía.
- **Compensación layout:** contenido principal `-translate-y-[30px]` + `pb-16`; widget chat y selector idioma anclados a `bottom: 59px` (lado a lado en desktop), ambos fade out al scroll.
- **Hydration-safe:** `force-dynamic` + `revalidate = 0` + `suppressHydrationWarning`; timestamps determinísticos del server (mtimes), nunca `Date.now()` en SSR (evita error hidratación #418).
- **NUESTROS SOCIOS** (`NuestrosSociosSection.tsx`): grillas dinámicas por tier (platino/oro columna derecha; plata/bronce/standard ancho completo debajo). Alturas por tier: platino 100% (glow ring ámbar), oro 80%, plata 55%, bronce 35%, standard 10% (BASE_H=120). Datos del RPC `obtener_socios_publicos`. Click abre `SponsorModal`.
- **ALIANZAS ESTRATÉGICAS** (sub-sección): grid responsive 3–6 columnas de `strategic_partners` activos; modal unificado con badge de categoría y bloque "Acciones conjuntas".
- **NUESTRO EQUIPO** (`AboutSection.tsx`): título columna izquierda (tipografía Impact, gradient) + fichas horizontales de miembros rodeándolo (primeras 9 en grid 3 cols; luego ancho completo). Modal de perfil al click. Datos de RPC `obtener_miembros_publicos` (sin PII). **SaladilloExportSection** integrada al final: grid de embajadores (posición 1–4) + testimonios + formulario de creación pública.
- **Métricas de Impacto:** patrón server-data → client-UI (`ImpactSection.tsx` server async fetch → `ImpactSectionClient.tsx` animado con contadores y carrusel de novedades, tabs, locales date-fns por idioma).
- **Comisiones:** grid visual estático con colores/iconos por comisión, textos i18n.
- **Buzón de Ideas** (`IdeasSection.tsx`): 2 columnas desktop. Izquierda: título 3 líneas + descripción + beneficios (flex horizontal). Derecha: formulario `PublicIdeasForm` (textarea, checkbox anónimo, contacto opcional) + beneficio "Seguimiento real". Envío a `POST /api/ideas` (RPC `insert_idea`, mín. 10 chars).
- **Videoteca** (`VideotecaSection.tsx`): búsqueda y filtro por categoría usando `videoService.getPublicVideos()`; thumbnails mqdefault; resúmenes IA.

### Muro Público (`/muro`)
Noticias multicanal filtradas por audiencia (público siempre; otros canales solo con sesión). Comentarios vía `/api/news-comments` (autenticados, con nombre de member). Medios con aspect ratio original.

### Mapa Productivo (`/mapa-productivo` + `/registro-mapa`)
Landing informativa hardcodeada (beneficios empresas/estudiantes, estadísticas, pasos). Registro dual en client component: Empresa (nombre, sector, oferta/demanda, desafío tecnológico → `mapa_empresas`) o Estudiante (escuela, especialidad, habilidades → `alumnos_talentos`).

### Acciones de Impacto (`/acciones` + `/acciones/[id]`)
Catálogo con filtros por tipo (capacitación/evento social/divulgación). Detalle con formulario de inscripción pública (`ActionRegistrationForm` → `registerToAction` → `action_registrations`).

### Artículos (`/articulo/[slug]`)
Artículos con slugs amigables, `generateMetadata` SEO/OpenGraph, video relacionado opcional, medios adjuntos.

### Capacitaciones (`/capacitaciones/[id]`)
Detalle mobile-first: player YouTube embebido, badge LIVE si `is_live`, **LivePoll** (encuesta en vivo con cookie dedup httpOnly 24h via `voteLivePollAction`; lee conteo antes de incrementar contra race conditions).

### Aula Virtual (`/clases/[id]`)
Sala completa en tiempo real (client component, 1213 líneas):
- **Chat realtime** via Supabase Realtime/Broadcast
- **Modómetro:** votación de ritmo ("Voy bien"/"Me perdí"/"Muy rápido")
- **Mano Alzada:** cola de turno de palabra (atender/bajar por docente)
- **Preguntas votables** con toggle de voto (RPC `toggle_pregunta_voto`) y marcado de resueltas
- **Encuestas de clase** con opciones JSONB
- **Semáforo de comprensión** (verde/amarillo/rojo, reinicio docente via RPC `reiniciar_semaforo_clase`)
- **Consola del Docente:** cambia vista chat/modómetro, reinicia votos, gestiona cola, configura Meet URL y modalidad
- **Identificación por dispositivo** localStorage anónimo
- Estado de streaming/en vivo via `postgres_changes` sobre `clases_virtuales`
- 14 server actions propias en `clases/[id]/actions.ts`

### Certificados Digitales (`/certificados/[codigo]`)
Verificación pública por QR/código único. Muestra alumno, título, fecha, competencias, horas cátedra. Meta tags SEO condicionales (noindex si inválido).

### Eventos Presenciales (`/eventos/[id]` y subrutas)
Sistema completo de interacción en vivo (client, 1573 líneas):
- **Acreditación QR** + formulario (nombre, email, teléfono, organización) → `POST /api/eventos/registro` (upsert tolerante unique evento+email) + email bienvenida Resend
- **Credencial por dispositivo** (localStorage, sin login)
- **Preguntas al orador** (`/preguntar`): máx. 250 chars, likes persistidos en localStorage, anonimato opcional
- **Pantalla de preguntas** (`/pantalla-preguntas`): ranking aprobadas por likes, realtime, QR lateral
- **Nube de palabras** (`/nube` + `/pantalla-nube`): UNA palabra por dispositivo (máx. 20 chars), múltiples nubes activas por evento, normalización diacríticos, concepto de charla dinámico (`nube_concepto` propagado por Realtime)
- **Encuestas** con resultados visibles en vivo
- **Semáforo de Comprensión v3:**
  - Botón anónimo "NO ENTIENDO, ME PERDÍ" → `registrarVotoNegativo(eventoId, dispositivoId)` con **dedup server-side por dispositivo por ciclo** (desde último reset) + cooldown client-side 5s
  - Cálculo centralizado `calcularEstadoSemaforo(votosNegativos, totalAcreditados)` en `lib/eventos/semaforo.ts` (DRY, funciones puras Edge-compatible): VERDE <30%, AMARILLO 30–49%, ROJO ≥50%; denominador seguro `Math.max(total, votos, 1)`
  - Reset (`resetearSemaforo()`, requiere admin/coordinador): actualiza `semaforo_last_reset_at=now()`; NO borra votos (los COUNT filtran por fecha)
  - 3 suscripciones Realtime por cliente: INSERT en votos (contador), UPDATE en `eventos` (reset/concepto/herramientas), INSERT/DELETE en `eventos_asistentes` (denominador)
  - Arquitectura: 3 clientes independientes (móvil, consola orador, pantalla gigante) calculan estado localmente
- **Pantalla gigante** (`/pantalla`): modos Bienvenida (QR + conteo asistentes) → Encuestas (barras animadas) → Preguntas → Nube, controlados por `modo_pantalla_gigante`; fondos animados Framer Motion; estado semáforo visible
- Toggle individual de herramientas por evento: `herramientas_activas` JSONB (`encuestas`, `preguntas`, `nube`, `semaforo`)

### Votación Pública (`/votar`)
Busca la encuesta activa global (`polls.is_active=true`) y renderiza votación en tiempo real (`VotingClient`).

### Portal del Sponsor (`/sponsors/[id]`)
Acceso por token privado. Datos del sponsor, último reporte de impacto IA (4 secciones), acciones vinculadas al reporte (o últimas 6), invitaciones destacadas por rubro. noindex.

### Página Socios (`/socios`)
Página pública dedicada (revalidate 3600): sponsors + alianzas estratégicas + canales de difusión vía `getSociosData()` (agregación con Promise.all y errores tolerantes → arrays vacíos). Reutilizada por `NuestrosSociosSection` de la landing.

### Chat Widget Asistente ITEC
Widget flotante (`ChatWidgetWrapper` con `dynamic(..., {ssr:false})` lazy-load) montado en el root layout. Visible en páginas públicas EXCEPTO rutas de eventos/clases (`EVENT_ROUTES`: `/eventos/*`, `/dashboard/eventos-presenciales/*`, `/dashboard/eventos/*`, aula virtual). Endpoint `/api/asistente` (RAG 5 niveles + contexto DB paralelo). Historial persistido en localStorage (`itec_chat_mensajes`), ID de sesión persistente, avatar desde DB, feedback integrado. Posición `bottom: 59px`, fade out al scroll.

---

## 12. Dashboard de Miembros

Ver tabla de rutas en §4. Resumen funcional:

- **Muro** (`/dashboard/muro`): noticias internas (`notas_miembros` publicadas), formato multicanal.
- **Reuniones** (`/dashboard/reuniones`): enlace Meet general persistente (`site_settings.general_meet_url` via `getGeneralMeetUrlAction`), **acta colaborativa del día** (`GeneralMeetingRoom`): edición de notas, guardado (`saveNotesAction`), procesamiento IA (resumen/action items), finalización y publicación (`finalizeAndPublishAction` → `meeting_notes`), historial de actas publicadas.
- **Drive** (`/dashboard/drive`): carpetas por comisión (mapeo declarativo `DRIVE_FOLDERS` en `lib/drive.ts` con fallback carpeta general) + carpeta raíz configurable. Listado via `getFolderFilesAction` → Google Drive API Service Account.
- **Ideas** (`/dashboard/ideas`): gestión de ideas (crear, cambiar estado — admin borra). Badge pendientes en sidebar.
- **Perfil** (`/dashboard/perfil`): edición nombre/bio/teléfono/LinkedIn/frase/tareas + avatar (bucket `avatars`).
- **Certificados/Pasaporte Digital**: búsqueda por nombre (`ilike full_name`) de certificados emitidos, visualización interactiva con QR verificable.
- **Capacitaciones** (gestión): CRUD con dashboard de estadísticas; creación de acciones en `/dashboard/acciones/nueva`.
- **Streaming**: centro de transmisión (ver §13).
- **Saladillo for Export** (`/dashboard/saladillo-for-export`): gestión de testimonios de saladillenses en el mundo — aprobar/rechazar, asignar embajadores (posición 1–4), crear testimonios, eliminar.
- **AI Processor** (`/dashboard/ai`): pegar transcripciones → `processTextAction` → resumen + tareas + flash noticioso (guarda en `news_flashes` con commission).

---

## 13. Herramientas de Administrador

Sidebar con submenús `<details>` colapsables color-coded:
- **Prensa** (cyan): Gacetillas (`prensaNews`), Gestión de Prensa (`prensa`)
- **Sponsors** (amber): Muro Sponsors (`sponsorsNews`), Gestión de Sponsors (`sponsors`)
- **Herramientas para Eventos** (púrpura): Encuestas, Sistema Preguntas, Nube Ideas, Semáforo, Crear/Editar Evento
- Items sueltos: Miembros, Comunicación, Settings, Entrenamiento Asistente, Videoteca, AI, Streaming, Saladillo for Export

Detalle:
- **Miembros** (`/dashboard/miembros`): aprobar/rechazar/activar/desactivar, roles, comisiones. Integra correos pre-aprobados (`allowed_emails`) como filas sintéticas `status:'pre-aprobado'`. Modelo 1 miembro → 1 comisión.
- **Settings** (`/dashboard/settings`): identidad visual del sitio + gestión de API keys (`api_settings`) con prioridad sobre env vars (forms: `SettingsForm`, `ApiKeysSettingsForm`).
- **Entrenamiento del Asistente**: editar system prompt (`ai_prompt_settings`), upload/delete/list docs del bucket, botón sync (`syncDocsAction`).
- **Encuestas en Vivo**: CRUD (`PollManager`), activar/desactivar, pantalla de proyección, analytics históricas (Recharts), marcar completada.
- **Sistema de Preguntas** (`/dashboard/eventos`): lista eventos → moderación (`/moderacion`): aprobar (`.update({aprobada:true})`), borrar, proyectar, compartir links.
- **Eventos Presenciales** (`/dashboard/eventos-presenciales`): CRUD con slug QR, modalidad, Meet URL. Panel del Orador (`[id]/PanelOradorClient`): switches herramientas grid 2x2, modo pantalla gigante (orden Bienvenida → Encuestas → Preguntas → Nube), campo Concepto de Charla (`actualizarConceptoNube`), panel Semáforo (tarjetas stats, umbrales, reinicio con auth check), conteo asistentes realtime (INSERT/DELETE).
- **Nubes** (`/dashboard/nubes`): gestión/exportación de nubes generadas.
- **Prensa** (`/dashboard/prensa`): ABM medios + envío gacetillas por email (Resend) con selección de destinatarios y recursos multimedia. Historial en `prensa_envios_log`.
- **Gacetillas** (`/dashboard/prensaNews`): crear notas para medios, enviar (modal `SendGacetillaModal` con plantilla HTML responsive `generatePrensaEmailHtml` — bloque Recursos Multimedia con botones descarga), historial (`PrensaEnviosHistoryModal`).
- **Sponsors** (`/dashboard/sponsors`): CRUD comercial (tiers, rubros, logos monocromo/color a Storage `sponsors-logos`), alta como modal controlado (`SponsorRegistrationForm` con react-hook-form + Zod), acciones del período (`createAccionAction`), reportes de impacto IA (Ollama), **Socios Estratégicos** (sección superior con divisor; CRUD `partner-actions.ts` con rol `admin` ESTRICTO — no coordinadores; validación Zod `actions_description` min 10 chars; modal `StrategicPartnerModal` con logo a Storage, cacheControl 3600). Página server carga sponsors + acciones + partners en paralelo (`Promise.all`).
- **Invitaciones** (`dashboard/actions/invitations.ts`): `generateInvitationAction` arma mensaje WhatsApp para invitar a sponsor/capacitación (usa `NEXT_PUBLIC_SITE_URL`).
- **Saladillo for Export** (`/dashboard/saladillo-for-export`): gestión de testimonios de saladillenses en el mundo — aprobar/rechazar, asignar embajadores (máx. 4 posiciones), crear testimonios (con upload foto a Storage), eliminar. Server actions admin en `actions.ts`, server action pública en `app/actions/saladillo-export.ts`.
- **Videoteca** (`/dashboard/videoteca`): CRUD videos + `generateVideoSummaryAction` (IA).

---

## 14. Inventario de Server Actions

19 archivos `'use server'`. Patrón común: validar input (Zod cuando aplica) → `getCurrentMember()` + check rol → mutar → `revalidatePath()` → retornar `{ success, error? }`.

| # | Archivo | Funciones exportadas |
|---|---------|---------------------|
| 1 | `app/clases/[id]/actions.ts` | `updateClaseMeetUrlAction`, `updateClaseModalidadAction`, `crearEncuestaAction`, `toggleEncuestaActivaAction`, `marcarPreguntaResueltaAction`, `atenderManoAlzadaAction`, `bajarManoAlzadaAction`, `reiniciarSemaforoAction`, `votarModometroAction`, `levantarManoAction`, `publicarPreguntaAction`, `toggleVotoPreguntaAction`, `responderEncuestaAction`, `votarSemaforoAction` |
| 2 | `app/dashboard/actions.ts` | `processTextAction` (IA transcripciones → news_flashes) |
| 3 | `app/dashboard/actions/invitations.ts` | `generateInvitationAction` (mensaje WhatsApp) |
| 4 | `app/dashboard/comunicacion/actions.ts` | `createMulticanalNewsAction`, `updateNotaAction`, `deleteNotaAction`, `swapNotasOrderAction` |
| 5 | `app/dashboard/drive/actions.ts` | `getFolderFilesAction` (Google Drive API) |
| 6 | `app/dashboard/encuestas/actions.ts` | `createPollAction`, `updatePollAction`, `togglePollStatusAction`, `deletePollAction`, `submitSingleVoteAction`, `markPollAsCompletedAction` |
| 7 | `app/dashboard/entrenamiento-asistente/actions.ts` | `getPromptAction`, `savePromptAction`, `listDocsAction`, `uploadDocAction`, `deleteDocAction`, `syncDocsAction` |
| 8 | `app/dashboard/ideas/actions.ts` | `createIdeaAction`, `updateIdeaStatusAction`, `deleteIdeaAction` |
| 9 | `app/dashboard/miembros/actions.ts` | `updatePhoneAction`, `approveMemberByEmailAction`, `approveMemberAction`, `deactivateMemberAction`, `rejectMemberAction`, `updateRoleAction`, `assignCommissionAction` |
| 10 | `app/dashboard/perfil/actions.ts` | `updateProfileAction` |
| 11 | `app/dashboard/prensa/actions.ts` | `createMedioAction`, `updateMedioAction`, `deleteMedioAction`, `sendGacetillaToMedios`, `getActiveMediosPrensa`, `getGacetillaEnviosHistory` |
| 12 | `app/dashboard/reuniones/actions.ts` | `getGeneralMeetUrlAction`, `saveNotesAction`, `finalizeAndPublishAction` |
| 13 | `app/dashboard/settings/actions.ts` | `updateSiteSettingsAction`, `getSettingsAction`, `updateSettingAction` |
| 14 | `app/dashboard/sponsors/actions.ts` | `createAccionAction`, `deleteAccionAction`, `createReporteAction`, `updateSponsorAction`, `createSponsorAction`, `deleteSponsorAction` |
| 15 | `app/dashboard/sponsors/partner-actions.ts` | `createStrategicPartner`, `updateStrategicPartner`, `deleteStrategicPartner` (admin estricto), `getStrategicPartners` (público), `getStrategicPartnersAdmin` |
| 16 | `app/dashboard/streaming/actions.ts` | `getStreamingStatus`, `toggleStreamingAction`, `updateStreamingUrlAction` |
| 17 | `app/dashboard/videoteca/actions.ts` | `createVideoAction`, `updateVideoAction`, `deleteVideoAction`, `generateVideoSummaryAction` |
| 18 | `app/dashboard/eventos-presenciales/herramientasActions.ts` | `actualizarHerramientasActivasAction`, `actualizarModoPantallaAction`, `actualizarConceptoNube` |
| 19 | `app/dashboard/eventos-presenciales/semaforoActions.ts` | `registrarVotoNegativo`, `verificarVotoDispositivo`, `obtenerEstadoSemaforo`, `resetearSemaforo` |
| 20 | `app/dashboard/saladillo-for-export/actions.ts` | `aprobarTestimonioAction`, `rechazarTestimonioAction`, `setEmbajadorAction`, `crearTestimonioAdminAction`, `eliminarTestimonioAction` (requieren admin) |
| — | `app/actions/saladillo-export.ts` | `crearTestimonioSaladilloExport` (pública, upload foto a Storage + insert estado pendiente) |
| — | `components/capacitaciones/actions.ts` | `voteLivePollAction` (cookie dedup httpOnly 24h) |

---

## 15. Inventario de API Routes

⚠️ Ninguna declara `runtime='edge'` → todas Node.js runtime.

| Ruta | Métodos | Config | Input → Output |
|------|---------|--------|----------------|
| `/api/asistente` | POST | `maxDuration=60` | `{ mensaje, historial[], sessionId?, idioma? }` → `{ respuesta, modelo?, guardado? }`. Cadena OpenCode→Groq→OpenRouter→Gemini con reintentos multi-pasada bajo deadline 48s, RAG 5 niveles, contexto DB paralelo, auditoría |
| `/api/asistente/debug` | GET | — | Diagnóstico: resume env keys (OpenCode/Groq/OpenRouter/HF/Gemini/Ollama/Supabase) y hace ping REAL a cada provider. Lee `api_settings`. |
| `/api/asistente/test` | GET/POST | — | GET: env check. POST: `{ messages[] }` → test chat OpenRouter |
| `/api/asistente/feedback` | POST | — | `{ historial[], calificacion, comentario? }` → Ollama sintetiza tema/utilidad → embedding → `asistente_feedback` |
| `/api/chat` | POST | — | `{ message, history[] }` → ReadableStream SSE (SDK Groq, lazy-init `getGroq()`, RAG cascade + prompt maestro + reglas anti-alucinación) |
| `/api/chat/guardar` | POST | — | `{ conversation[] }` (mín. 2 mensajes) → `chat_conocimiento` tipo `autogestion` |
| `/api/eventos/registro` | POST | — | `{ evento_id, nombre, email, telefono?, organizacion? }` → upsert `eventos_asistentes` + email bienvenida Resend |
| `/api/ideas` | POST | — | `{ mensaje(≥10 chars), anonimo?, nombre?, email?, telefono? }` → RPC `insert_idea` |
| `/api/news/process` | POST | — | Solo admin (`getCurrentMember`): `{ titulo, texto/datos_crudos, commission_id }` → IA genera 4 versiones → `news_flashes` |
| `/api/news-comments` | GET/POST | — | GET `?newsFlashId=` → comentarios no eliminados. POST `{ news_flash_id, content }` autenticado (resuelve `member_name`) |
| `/api/press-news` | GET | — | Feed `notas_medios` publicadas (formato flash normalizado) |
| `/api/sponsors-news` | GET | — | Feed `notas_sponsors` publicadas (formato flash normalizado) |
| `/api/streaming/status` | GET | `force-dynamic`, header `Cache-Control: s-maxage=30, stale-while-revalidate=60` | Estado público streaming desde `site_settings`/`api_settings` (cliente anon) → `{ isActive, youtubeUrl }` |
| `/auth/callback` | GET | — | Intercambia código OAuth por sesión; verifica `status` member (pendiente → signOut+home; activo → dashboard) |
| `/auth/signout` | POST | — | Cierra sesión → `/login?logout=true` |

---

## 16. Inventario de Componentes

`src/components/` — 10 subdirectorios, 31 .tsx + 1 css + 1 actions.ts. Balance: ~29 client components, 1 server (`ImpactSection.tsx`). Patrón dominante: client + framer-motion + Supabase browser SDK.

| Carpeta | Archivos | Rol |
|---------|----------|-----|
| `landing/` | `Navbar` (client, estado sesión, menú móvil, i18n), `HeroSection` (client, consulta clase en vivo, StreamingPlayer condicional), `AboutSection` (equipo + modal perfil + SaladilloExportSection), `ImpactSection` (**server**, fetch acciones/artículos/flashes), `ImpactSectionClient` (contadores/carrusel animado, i18n), `ComisionesSection` (grid estático), `IdeasSection` (2 columnas), `VideotecaSection` (búsqueda/categoría), `StreamingPlayer` (URL→embed YouTube), `Footer` (i18n + acceso miembros), `FloatingLanguageSelector` (FAB es/en/pt, bottom 59px, fade out scroll) | Landing |
| `home/` | `SponsorHeaderBar` (marquesina fixed bottom), `NuestrosSociosSection` (grillas por tier + alianzas + canales, tabs, fetch cliente si no vienen props), `SponsorModal` (modal unificado `ModalItem` discriminador `_kind: 'sponsor'\|'partner'`, cierre Escape) | Socios landing |
| `comunicacion/` | `ComunicacionTabs`, `NewsFlashMulticanalEditor` (editor IA 4 canales), `NewsWallMulticanal` (tabs canal + slideshow medios object-contain), `NotasMulticanalList` (editar/borrar/publicar/reordenar) | Comunicación |
| `chat/` | `ChatWidget` (widget flotante, localStorage historial), `ChatWidgetWrapper` (lazy `ssr:false` + oculta en EVENT_ROUTES), `ChatWidget.css` | Asistente |
| `capacitaciones/` | `LivePoll` (votación realtime), `actions.ts` (`voteLivePollAction` cookie dedup) | Encuesta en vivo |
| `auth/` | `LoginClientContent` (pantalla error OAuth), `MembersAccessButton` (dispara signInWithOAuth google) | Auth |
| `dashboard/` | `SidebarIdeasLink` (badge pendientes), `sponsors/SponsorRegistrationForm` (react-hook-form + Zod, modal controlado onClose/onCreated), `sponsors/StrategicPartnerModal` (alta/edición partner + upload Storage) | Admin |
| `ideas/` | `PublicIdeasForm` | Formulario público |
| `prensa/` | `SendGacetillaModal`, `PrensaEnviosHistoryModal` | Prensa |
| `reuniones/` | `GeneralMeetingRoom` (acta colaborativa + IA + publicar) | Reuniones |
| `saladillo-export/` | `SaladilloExportSection` (embajadores grid + testimonios + formulario pública, fetch client si no vienen props) | Saladillo for Export |

Componentes inline en carpetas de rutas (no en `components/`): `ArticleDetailClient`, `CertificadoViewer`, `VotingClient`, `AIProcessorForm`, `certificados-interactive`, `FileList`, `PollManager`, `AnalyticsClient`, `PresentationClient`, `EntrenamientoForm`, `EventListClient`, `EventosPresencialesClient`, `PanelOradorClient`, `IdeasManagementClient`, `MemberManagementTable`, `MediosAdmin`, `MedioForm`, `ProfileForm`, `SponsorsAdmin`, `SponsorForm`, `StreamingControls`, `VideotecaManager`, `SettingsForm`, `ApiKeysSettingsForm`.

---

## 17. Sistema Multi-idioma (i18n)

Arquitectura context-based propia (sin framework externo):

- **`LanguageContext.tsx`** ('use client'): `type Language = 'es'|'en'|'pt'` (default `es`). Al montar lee `localStorage('itec_lang')`; sin preferencia detecta `navigator.language.slice(0,2)` (acepta en/pt). `setLanguage` persiste en localStorage. Expone `{ language, setLanguage, dict }` con fallback a `dictionary.es` durante SSR (render inicial siempre español → evita hydration mismatch). Hook `useLanguage()` lanza error fuera del provider.
- **`dictionary.ts`** (~1106 líneas): objeto plano con 3 claves tipadas estructuralmente idénticas (`es` línea 2, `en` línea 371, `pt` línea 740 — ~369 líneas/idioma).
- **16 secciones por idioma:** `navbar`, `hero`, `impact`, `impactSection`, `videoteca`, `videotecaSection`, `about`, `comisiones`, `ideas`, `footer`, `registroMapa`, `eventos`, `preguntar`, `votar`, `login`, `asistente`. Anidamiento 2–3 niveles.
- ⚠️ Particularidad: contiene **contenido dinámico embebido por UUID** — `impactSection.feedData` (títulos de artículos específicos) y `videotecaSection.videosData` (ai_summaries de videos concretos), triplicados por idioma. Las traducciones de contenido específico están HARDCODEADAS en el diccionario, no en BD. Al agregar contenido nuevo traducible, actualizar las 3 claves de idioma.

---

## 18. Integraciones Externas

### Supabase
- Database PostgreSQL con pgvector, RLS policies (75 migraciones)
- Auth: Google OAuth, sesiones vía cookies SSR (@supabase/ssr)
- Storage: buckets `article-media`, `avatars`, `training-docs`, `sponsors-logos`
- Realtime (`postgres_changes`): clases virtuales en vivo; votos encuestas/preguntas/nubes de eventos; semáforo (INSERT votos + UPDATE eventos reset + asistentes INSERT/DELETE); concepto nube dinámico; badge "Aula en vivo" del Hero; chat aula virtual (Broadcast, independiente de postgres_changes)

### Google Drive API
- Service Account (JSON en `site_settings`)
- Carpetas por comisión: mapping declarativo `DRIVE_FOLDERS` en `lib/drive.ts` (5 entradas: tecnología, educación, comunicación, proyectos, general — IDs placeholder a completar) + `drive_folder_id` en tabla `commissions` + root configurable
- Funciones: `listFolderFiles(folderId)` (`services/drive.ts`)

### Google Gemini
- Generación texto (`gemini-2.0-flash`): edición de texto exclusiva
- Embeddings (`gemini-embedding-001` / `text-embedding-004` en script ingesta)
- Hasta 4 API keys en `api_settings` con rotación/fallback chain + env alternativa (env vars tienen prioridad)

### OpenCode
- Generación texto (`opencode/glm-5-free`): **provider principal** de asistente + generación multicanal
- API key única (`OPENCODE_API_KEY`), endpoint `https://api.opencode.ai/v1/chat/completions`

### Resend (Emails)
- Email bienvenida registro a eventos (`sendEventWelcomeEmail`, HTML dark-theme inline)
- Distribución gacetillas a medios (`generatePrensaEmailHtml` template responsive)
- Remitente prensa configurable (`RESEND_FROM_PRENSA` / api_settings)
- Sin API key válida: simula envío por consola (no falla)

### Vercel
- Deploy automático push a `main` (GitHub Action con amondnet/vercel-action)
- `maxDuration 60` para `/api/asistente`

---

## 19. Convenciones de Código

### Server vs Client Components
- Server por defecto en `page.tsx`; `'use client'` solo cuando se requiera hooks/handlers/estado. Los componentes client interactivos suelen vivir como archivos hermanos del page (ej. `XxxClient.tsx`).
- Patrón server-data → client-UI: server async hace fetch, pasa props al client (ejemplo canónico: `ImpactSection` → `ImpactSectionClient`).
- ⚠️ Excepciones históricas: `/clases/[id]`, `/eventos/[id]`, `/registro-mapa`, `/dashboard/prensaNews`, `/dashboard/sponsorsNews` son pages client enteras.

### Params de rutas dinámicas
⚠️ Conviven estilos: algunas páginas leen `params` como `Promise<...>` (`certificados/[codigo]`, `articulo/[slug]`), otras síncrono legacy (`sponsors/[id]`, `capacitaciones/[id]`), y una soporta ambos (`eventos-presenciales/[id]` chequea `params.then`). Para código NUEVO usar el estilo Promise de Next.js 16.

### Server Actions
- Archivo `actions.ts` por feature con `'use server'` arriba.
- Validación Zod. Check rol con `getCurrentMember()`. `revalidatePath()` tras mutar. Retornar `{ success, error }` o `{ error }`.
- Tipos exportados junto a las actions (interfaces de input/output).

### API Routes
- Para consumo desde client components o terceros (feeds públicos GET sin auth).
- Errores: `NextResponse.json({ error }, { status })`. Nunca exponer detalles internos de providers.

### Estilos
- Tailwind v4 utilitario + variables CSS custom (tema oscuro único). Animaciones custom en `globals.css` (keyframes listados §5) + Framer Motion para interactivos.
- Tipografía Impact para títulos de sección grandes con gradient en palabra clave.

### TypeScript
- Strict. Tipos DB en `types/database.ts` (enums de dominio, interfaces por tabla, `Database` genérico estilo Supabase con `Tables.{nombre}.{Row/Insert/Update}` construido con `Omit<>`).
- Interfaces locales adicionales permitidas por módulo.
- ⚠️ `strategic_partners` está tipada; verificar tipos al agregar tablas nuevas y mantener sincronizado `database.ts`.

### Routing/Layout
- App Router layouts anidados; sidebar dashboard persistente (no re-render al navegar); `scroll={false}` en Links del sidebar.

---

## 20. Variables de Entorno

Definidas en `.env.local` (única env file, gitignored; no existe `.env.example`).

### Usadas en código (src/)
| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Todos los clientes Supabase + next.config (remotePatterns) |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin clients en `/api/asistente`, `/api/chat`, debug, `comunicacion/actions` |
| `OPENCODE_API_KEY` | Asistente ITEC primario (`/api/asistente`), generación texto (`services/ai.ts`) — **provider FREE principal** |
| `GROQ_API_KEY` / `GROQ_API_KEY_2` | Asistente fallback (`/api/asistente`, `/api/chat`). Multi-key soportado |
| `OPENROUTER_API_KEY` / `OPENROUTER_API_KEY_2` | Asistente fallback + test route (**solo modelos FREE**). Multi-key |
| `GEMINI_API_KEY` / `GEMINI_APY_KEY` | ⚠️ typo histórico soportado (debug route + script ingesta). Env vars tienen prioridad sobre DB |
| `GOOGLE_GENERATIVE_AI_API_KEY` | `services/ai.ts` (Gemini fallback tras api_settings ×4) |
| `HF_API_KEY` | HuggingFace embeddings fallback |
| `OLLAMA_API_BASE_URL` | Default `https://ai.itecsaladillo.org.ar` (reportes sponsors, feedback) |
| `RESEND_API_KEY` / `RESEND_FROM_PRENSA` | Emails (con fallback a api_settings vía getSettingValue) |
| `NEXT_PUBLIC_SITE_URL` | URLs en emails/invitaciones |
| `NEXT_PUBLIC_MEET_LINK` | Página streaming (link Meet) |
| `NODE_ENV` | Cookie dedup solo en producción |

### Definidas pero NO usadas en código
`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, `SEMAFORO_PORT`, `PUBLIC_SITE_URL`, `PUBLIC_SUPABASE_*`, `NX_DAEMON`. No eliminar sin confirmar (pueden ser residuales o futuras).

⚠️ **Resolución híbrida:** muchas keys (Gemini ×4, HF, Resend, streaming) se resuelven PRIMERO desde tabla `api_settings` y solo como fallback desde env (`getSettingValue`). El dashboard Settings admin permite rotarlas sin redeploy.

---

## 21. Flujo de Datos y Patrones

```
Server Component  →  await createClient()      →  Supabase Query  →  Render HTML
                        ↓
                  getCurrentMember()            →  auth check / rol

Client Component  →  useLanguage()             →  dict i18n
                  →  createClient() (browser)  →  Supabase + Realtime subs
                  →  fetch('/api/...')          →  API Route → Service → Supabase
                  →  server action import       →  mutación directa

Server Action     →  getCurrentMember() → Zod → mutate → revalidatePath()
```

### Patrones para añadir features

**Ruta pública nueva:**
1. Carpeta en `src/app/[ruta]/` + `page.tsx` server
2. Interactividad → componente cliente hermano (`XxxClient.tsx`)
3. SEO → `generateMetadata`

**Feature de dashboard:**
1. Carpeta en `src/app/dashboard/[ruta]/` + `page.tsx` con `getCurrentMember()` + check rol
2. Link en sidebar: nav general (`navItems`) o herramienta admin (`adminNavItems`/submenú `<details>`), con `scroll={false}`; badge de conteo si aplica

**Server action nueva:** archivo `actions.ts` con `'use server'`, Zod, check rol, `revalidatePath()`.

**Endpoint API nuevo:** `src/app/api/[ruta]/route.ts`; considerar si debe excluirse del proxy matcher; sanitizar errores.

**Integración IA nueva:**
1. Provider/fallback en `services/ai.ts` (o fetch directo con timeouts + error sanitizado). Los providers de texto (OpenCode, OpenRouter, Gemini) ejecutan en paralelo multi-key para minimizar latencia.
2. Prompt editable en `ai_prompt_settings` (clave nueva)
3. Auditoría en `auditarRespuestaIA()` si genera texto visible
4. **Solo modelos gratuitos**

**Tabla nueva:**
1. Migración SQL numerada siguiente (RLS obligatoria)
2. Actualizar `src/types/database.ts`
3. Considerar publicación Realtime si hay suscripciones

---

## 22. Quirks y Gotchas Conocidos

⚠️ **Leer antes de modificar código relacionado.** Estas inconsistencias existen y son conocidas:

1. **Naming inconsistente eventos:** conviven familias `eventos_*` (`eventos_preguntas`, `eventos_nube_palabras` — usadas por `/eventos/[id]`, `pantalla`, `semaforoActions`) y `evento_*` singular (`evento_preguntas`, `evento_nubes` — usadas por `/preguntar`, `/nube`, `/pantalla-*`, `dashboard/eventos`). No "corregir" sin refactor completo coordinado.
2. **`itec_actions` vs `acciones_itec`:** el mismo dominio aparece con ambos nombres en distintos módulos. Verificar el nombre real contra la migración 007 antes de escribir queries.
3. **Tres formas de crear clientes Supabase** coexisten (§8.1). `services/videos.ts` usa el browser client aunque lo consumen páginas admin. Nuevos desarrollos: usar `lib/supabase/*`.
4. **Params Promise vs sync** en rutas dinámicas (§19). Código nuevo: estilo Promise.
5. **Typo histórico de env var:** `GEMINI_APY_KEY` (sin "I") es intencional y está soportado junto a `GEMINI_API_KEY`.
6. **`proxy.ts` reemplaza `middleware.ts`** (Next.js 16). Matcher excluye `api/chat` y `api/asistente`.
7. **Sin loading/error boundaries:** no existen `loading.tsx`/`error.tsx` globales ni por ruta.
8. **Contenido dinámico hardcodeado en dictionary.ts** (feedData/videoteca por UUID, triplicado en 3 idiomas) — no buscar esos textos en BD.
9. **Semáforo v3:** dedup server-side POR DISPOSITIVO POR CICLO (desde último reset), NO global. Reset NO borra votos (filtra por fecha). Denominador seguro `Math.max(total, votos, 1)`.
10. **Landing `force-dynamic` + `unstable_cache` fs:** los logos de sponsors se leen del FILESYSTEM, no de BD. Agregar/quitar logos = tocar `public/sponsors/blanco/` (monocromo) y/o tabla `sponsors` (color/portal). Cache 1h.
11. **`suppressHydrationWarning`** en `<html>` y marquesina: necesario por timestamps determinísticos. Evitar `Date.now()` en render SSR.
12. **ChatWidget excluido en rutas de eventos** (`EVENT_ROUTES` en wrapper) para no interferir con herramientas live.
13. **RLS abierta a propósito** en tablas realtime de aula virtual (mig. 060) y semáforo v3 (append-only): es diseño, no bug. No "endurecer" sin analizar el flujo anónimo.
14. **`obtener_socios_publicos` (068) es el RPC vigente** para socios; `obtener_sponsors_publicos` (066) quedó deprecated por compatibilidad.
15. **`strategic_partners` CRUD requiere admin ESTRICTO** (no coordinadores), a diferencia de otras herramientas admin.
16. **Dashboard pages client sin guard server:** `/dashboard/prensaNews` y `/dashboard/sponsorsNews` son client components sin guard server propio (protege el proxy + feeds públicos por diseño). No replicar este patrón para datos sensibles nuevos.
17. **`scratch/` está gitignored:** los scripts de diagnóstico ahí no están versionados; no depender de ellos en CI.
18. **CI/CD sin gates:** el workflow de deploy no corre lint/tests. Ejecutar `npm run lint` localmente antes de pushear.
19. **Migraciones con números duplicados** y sin rollback: aplicar manualmente en Supabase en orden cronológico de nombre.
20. **Timeouts y reintentos IA:** cadena del asistente con reintentos multi-pasada bajo deadline de 48s (OpenCode 13s → Groq 13s → OR 13s → Gemini 18s por intento, backoff 1.2s; errores permanentes 400/401/403/404/413 deshabilitan al provider en el request). Ollama 98s (reportes/feedback). No subir `max_tokens` ni `MAX_PROMPT_CHARS` sin revisar §9.7 (riesgo 413). Gemini timeout 20s en `services/ai.ts` para prompts multicanal largos (4 textos en paralelo).
21. **`docsContext.ts` es AUTOGENERADO** (~1366 líneas, "No editar"): regenerar con `npm run sync-docs`.
22. **Embeddings mixtos:** pgvector almacena vectores de 768 dims; HuggingFace produce 384 (zero-padded). Mezclar orígenes de embeddings en la misma colección degrada precisión de la búsqueda.
23. **`lib/drive.ts` tiene folder IDs placeholder** (`REEMPLAZAR_CON_ID_REAL`): el mapeo real vive en `commissions.drive_folder_id` / `site_settings`.

---

## 23. Stakeholders y sus Interfaces

| Stakeholder | Interfaz Principal | Contenido |
|-------------|-------------------|-----------|
| **Público General** | Landing, `/muro`, `/acciones`, `/articulo/[slug]`, `/mapa-productivo`, `/registro-mapa`, `/certificados/[codigo]`, `/socios`, `/votar` | Noticias públicas, acciones, artículos, mapa productivo, certificados, socios, votación |
| **Miembros** | Dashboard `/dashboard/*` | Muro interno, reuniones con acta, drive, ideas, perfil, pasaporte digital, aula virtual |
| **Administradores** | Dashboard + herramientas admin | Miembros, comisiones, comunicación multicanal, prensa, sponsors/partners, eventos presenciales, encuestas, nubes, streaming, videoteca, AI processor, settings, entrenamiento asistente |
| **Sponsors** | Portal `/sponsors/[token]` | Noticias exclusivas, reportes de impacto IA, invitaciones |
| **Prensa/Medios** | `GET /api/press-news` + email | Gacetillas con recursos multimedia, historial |
| **Asistentes a Eventos** | `/eventos/[id]/*` + pantallas | Acreditación QR, preguntas, nube, encuestas, semáforo |
| **Estudiantes/Alumnos** | `/capacitaciones/[id]`, `/clases/[id]`, `/registro-mapa` | Aula virtual interactiva, LivePoll, registro talento |
| **Saladillenses en el Mundo** | Sección About landing (formulario público) + admin `/dashboard/saladillo-for-export` | Testimonios, embajadores, gestión de contenido |

---

*Mantener este documento actualizado con cada cambio estructural relevante. Última revisión: septiembre 2026 (post-migración 071, integración OPENCODE).*  
