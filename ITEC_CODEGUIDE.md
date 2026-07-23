# ITEC Saladillo — Guía Técnica Completa para IA

## Stack Tecnológico
- **Framework:** Next.js 16.2.6 (App Router, Turbopack)
- **React:** 19.2.4
- **Lenguaje:** TypeScript (strict)
- **Estilos:** Tailwind CSS v4 + CSS custom properties (tema oscuro)
- **Base de datos:** Supabase PostgreSQL (45 migraciones)
- **Auth:** Supabase Auth + Google OAuth
- **Despliegue:** Vercel
- **Path alias:** `@/` → `./src/`

## Dependencias Clave
- `@supabase/supabase-js` 2.105.4, `@supabase/ssr` 0.10.3
- `groq-sdk` 1.3.0, `googleapis` 171.4.0 (Google Drive API)
- `framer-motion` 12.38.0, `lucide-react` 1.14.0, `recharts` 3.8.1
- `react-hook-form` 7.81.0, `zod`, `@hookform/resolvers`
- `resend` 6.12.3 (emails), `date-fns` 4.1.0
- `pdf-parse`, `dotenv`

## Estructura del Proyecto
```
src/
  app/                     # App Router (rutas públicas + dashboard + API)
    page.tsx               # Landing page
    login/                 # Login (Google OAuth)
    muro/                  # Muro público de noticias
    mapa-productivo/       # Mapa Productivo (directorio empresas + talento)
    acciones/              # Capacitaciones, eventos sociales, divulgaciones
    articulo/              # Artículos públicos
    capacitaciones/        # Detalle de capacitación
    clases/                # Aula virtual (streaming)
    certificados/          # Pasaporte Digital (verificación QR)
    eventos/               # Eventos presenciales (QR, acreditación, preguntas, nube, encuestas)
    sponsors/              # Portal del sponsor (por token)
    dashboard/             # Panel de miembros (requiere auth)
      layout.tsx           # Sidebar + layout del dashboard
      muro/                # Muro de noticias interno
      reuniones/           # Sala de reuniones (Google Meet)
      drive/               # Nube de archivos (Google Drive)
      ideas/               # Buzón de ideas
      perfil/              # Perfil del miembro
      capacitaciones/      # Gestión de capacitaciones
      certificados/        # Gestión de certificados
      comunicacion/        # Centro de comunicaciones (multicanal)
      miembros/            # Gestión de miembros (admin)
      encuestas/           # Encuestas (admin)
      eventos/             # Sistema de preguntas en vivo (admin)
      nubes/               # Gestión de nubes de palabras (admin)
      prensa/              # Gestión de medios de prensa (admin)
      prensaNews/          # Gacetillas de prensa (admin)
      sponsors/            # Gestión de sponsors (admin)
      sponsorsNews/        # Muro sponsors (admin)
      settings/            # Ajustes del sitio (admin)
      entrenamiento-asistente/ # Entrenamiento del asistente IA (admin)
      videoteca/           # Gestión de videos (admin)
      streaming/           # Streaming (admin)
      ai/                  # Procesador IA
      eventos-presenciales/ # Crear eventos presenciales (admin)
    api/                   # API routes
      asistente/           # Chat IA principal (OpenRouter + HuggingFace fallback)
      chat/                # Chat legacy (Groq)
      news/process/        # Procesamiento IA de noticias
      press-news/          # Feed gacetillas (GET)
      sponsors-news/       # Feed sponsors (GET)
      eventos/registro/    # Registro a eventos
      news-comments/       # Comentarios en noticias
    auth/                  # Auth callbacks
  components/
    landing/               # Componentes de landing page
    comunicacion/          # Componentes de comunicaciones (NewsWallMulticanal, editor, etc.)
    chat/                  # Widget flotante del asistente IA
    capacitaciones/        # Componentes de capacitaciones
    acciones/              # Formulario de registro a acciones
    reuniones/             # Sala de reuniones
    auth/                  # Componentes de autenticación
  services/
    auth.ts                # getCurrentMember(), signInWithGoogle(), isAdmin()
    ai.ts                  # Procesamiento con IA (OpenRouter), embeddings (Gemini), auditoría
    admin.ts               # CRUD de miembros, comisiones, prompts IA
    news.ts                # News multicanal (getAllMulticanalNewsFlashes, etc.)
    news-multicanal.ts     # Tipos: NewsFlashMulticanal, NewsComment
    drive.ts               # Google Drive: listFolderFiles(), getRecentFiles()
    videos.ts              # CRUD de videos
    actions.ts             # Acciones públicas
    sponsorReport.ts       # Generación de reportes de impacto con IA
  lib/
    supabase/              # Clientes Supabase (server, browser, admin)
    rag/                   # RAG cascade (P1-P4), conversaciones guardadas
    drive.ts               # Configuración de carpetas Drive por comisión
    email.ts               # Servicio de emails con Resend
    docsContext.ts         # Contexto de documentos para el asistente IA (auto-generado)
  types/
    database.ts            # Tipos completos de la DB (Member, Commission, ItecAction, etc.)
  locales/
    dictionary.ts          # Traducciones ES/EN/PT (context-based i18n, sin framework)
  proxy.ts                 # Next.js middleware (auth, protección de rutas)
  config/
    aiConfig.json          # Config del modelo IA
```

## Sistema de Autenticación
1. **Supabase Auth** con Google OAuth como provider principal.
2. **Pre-aprobación:** Los emails deben estar en `allowed_emails` para auto-aprobarse. Si no, quedan `status = 'pendiente'`.
3. **Trigger `handle_new_user()`** en Postgres: al crear un usuario en `auth.users`, crea el registro en `members`, verifica `allowed_emails`, asigna rol y comisión si corresponde.
4. **Proxy middleware (`proxy.ts`):** Protege `/dashboard/*`, redirige no-auth a `/login`, pending a `/acceso-pendiente`.
5. **Roles:** `admin`, `coordinador`, `miembro`, `colaborador`.
6. **Server Components** usan `getCurrentMember()` para obtener el miembro actual.
7. **Server Actions** (`'use server'`) también usan `getCurrentMember()` y verifican `member.role === 'admin'`.

## Base de Datos — Tablas Principales

### members
`id(uuid PK→auth.users)`, `full_name`, `email(UNIQUE)`, `avatar_url`, `role`(admin|coordinador|miembro|colaborador), `status`(activo|inactivo|pendiente), `bio`, `linkedin_url`, `phone`, `join_date`, `frase_itec`, `tareas_itec`

### commissions
`id(uuid PK)`, `name`, `slug(UNIQUE)`, `description`, `icon`, `color`, `is_active`, `coordinator_id(FK→members)`, `meet_link`, `drive_folder_id`

### commission_members
`commission_id(FK→commissions)`, `member_id(FK→members)`, `joined_at`, `is_coordinator` — Unique(commission_id, member_id)

### news_flashes (Multicanal)
`id`, `titulo`, `commission_id(FK)`, `author_id(FK)`, `original_text`, `summary`, `flash_text`, `source_type`, `is_published`, `tags`, **canales:** `texto_publico`, `texto_miembros`, `texto_sponsors`, `texto_medios`, `datos_crudos`, **flags:** `para_publico`, `para_miembros`, `para_sponsors`, `para_medios`, `media_urls(jsonb)`

### Notas por canal (generadas por IA)
`notas_publico`, `notas_miembros`, `notas_sponsors`, `notas_medios` — cada una con `id`, `created_at`, `news_flash_id(FK)`, `contenido`, `is_published`, `media_urls`

### itec_actions
`id`, `title`, `description`, `type`(capacitacion|evento_social|divulgacion), `status`, `target_audience`, `capacity`, `cost`, `start_date`, `end_date`, `location`, `thumbnail_url`, `tags(text[])`, `responsible_id(FK→members)`, `commission_id(FK→commissions)`, `materials_urls(text[])`, `media_urls(text[])`

### sponsors
`id`, `name`, `logo_url`, `website_url`, `contact_email`, `tier`(platino|oro|plata|bronce), `is_active`, `description`, `private_token(uuid UNIQUE)`, `nombre_empresa`, `actividad`, `zona_influencia`, `nombre_contacto`, `apellido_contacto`, `telefono`

### Eventos presenciales (QR)
`eventos` (slug QR, titulo, fecha, ubicacion), `eventos_asistentes`, `eventos_preguntas` (con likes), `eventos_encuestas` (con opciones y votos), `eventos_nube_palabras`

### Otras tablas
`allowed_emails`, `site_settings`, `videos`, `public_articles`, `ideas`, `polls`/`poll_questions`/`poll_options`/`poll_votes`, `sponsor_reports`, `clases_virtuales`, `certificados_digitales`, `ai_prompt_settings`, `asistente_feedback`, `saved_conversations`, `training_docs_embeddings`, `mapa_empresas`, `medios_prensa`

## Sistema de Noticias Multicanal (Feature Central)
El flujo de creación de noticias funciona así:
1. **`NewsFlashMulticanalEditor`** — Editor que recibe datos crudos y los envía al backend.
2. **`/api/news/process`** — Llama a `generateMulticanalNews()` en `services/ai.ts` que usa OpenRouter para generar 4 textos diferentes para 4 canales (público, miembros, sponsors, medios) usando un prompt de agente de prensa.
3. Los textos generados se guardan en `news_flashes` con los campos `texto_publico`, `texto_miembros`, `texto_sponsors`, `texto_medios`.
4. También se crean registros en `notas_publico`, `notas_miembros`, `notas_sponsors`, `notas_medios`.
5. **`NewsWallMulticanal`** — Componente de visualización con tabs: Público, Muro Noticias (interno), Muro Sponsors, Prensa.

## Sidebar del Dashboard (`layout.tsx`)
- **Nav principal** (todos los miembros): Muro, Sala Reuniones, Aula Virtual, Pasaporte Digital, Buzón Ideas, Mi Perfil, Nube Archivos, Mapa Productivo.
- **HERRAMIENTAS** (solo admin): Items sueltos + submenús colapsables:
  - **Prensa** (cyan): Gacetillas, Gestión de Prensa
  - **Sponsors** (amber): Muro Sponsors, Gestión de Sponsors
  - **Herramientas para Eventos** (púrpura): Encuestas, Sistema Preguntas, Nube Ideas, Crear Evento
- El sidebar usa `scroll={false}` en todos los links para mantener la posición al navegar.
- Diseño responsive con color-coding por sección.

## Servicios de IA
1. **OpenRouter (DeepSeek Chat)** — Provider principal para el asistente y procesamiento de noticias.
2. **Groq (Llama-3.1-8B-Instant)** — Chat legacy (`/api/chat`). Requiere `GROQ_API_KEY`.
3. **HuggingFace** — Fallback para el asistente + embeddings.
4. **Gemini (text-embedding-004)** — Embeddings vectoriales primarios.
5. **Ollama (Llama3.2)** — Generación de reportes de sponsors + consolidación de feedback (hosteado en `https://ai.itecsaladillo.org.ar`).
6. **RAG Cascade** — Búsqueda semántica en 4 niveles: P1 (docs locales), P2 (Supabase Storage), P3 (conversaciones previas), P4 (web DuckDuckGo).
7. **AI Auditor** — Monitorea respuestas por palabras prohibidas, exposición de rutas, etc.

## Integraciones Externas
- **Supabase:** DB, Auth, Storage (3 buckets: article-media, avatars, training-docs), Realtime.
- **Google Drive API:** Service Account, carpetas por comisión, listado de archivos.
- **Resend:** Emails transaccionales (aprobación, notificaciones).
- **Vercel:** Despliegue automático desde `main`.

## Convenciones de Código
- **Server Components** por defecto, `'use client'` solo cuando es necesario (hooks, eventos, estado).
- **Server Actions** (`'use server'`) para mutaciones de datos.
- **API Routes** para endpoints que consumen client components (`/api/press-news`, `/api/sponsors-news`).
- **Zod** para validación de formularios y server actions.
- **Tailwind CSS v4** con variables CSS personalizadas para el tema oscuro.
- **`revalidatePath()`** en server actions para refrescar caché después de mutaciones.
- **Layout anidado:** Dashboard usa `layout.tsx` con sidebar persistente.

## Variables de Entorno Requeridas
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`
- `RESEND_API_KEY`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_KEY`

## Patrón para Añadir Nuevas Features

### Para rutas públicas:
1. Crear carpeta en `src/app/[ruta]/`
2. `page.tsx` (Server Component por defecto)
3. Si necesita interactividad, crear componente cliente.

### Para rutas del dashboard:
1. Crear carpeta en `src/app/dashboard/[ruta]/`
2. `page.tsx` con `getCurrentMember()` y verificación de rol.
3. Si es admin, agregar link en `adminNavItems` o en un submenú de `layout.tsx`.
4. Para componentes cliente, agregar API route en `src/app/api/` si necesita fetch de datos.

### Para server actions:
1. Crear `actions.ts` con `'use server'`.
2. Validar con Zod, verificar rol admin con `getCurrentMember()`.
3. Llamar `revalidatePath()` después de mutar.

### Para el sidebar:
1. Si es nav general, agregar a `navItems` en `layout.tsx`.
2. Si es admin tool, agregar a `adminNavItems` o crear submenú `<details>`.
3. Agregar `scroll={false}` a los links.
