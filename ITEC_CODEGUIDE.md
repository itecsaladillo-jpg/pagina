# ITEC Saladillo — Guía Técnica Integral para IA

## Descripción General
Plataforma web full-stack de **ITEC Saladillo** (Asociación Civil de Ciencia y Tecnología "Augusto Cicaré", Saladillo, Buenos Aires, Argentina). Funciona como hub comunitario que conecta miembros, sponsors, prensa y público general mediante contenido educativo, gestión de eventos presenciales, interacción en vivo con audiencias, herramientas de comunicación impulsadas por IA y un Mapa Productivo de empresas locales y talento técnico. La landing incluye streaming en vivo de YouTube y una barra inferior de sponsors con marquesina infinita.

---

## Stack Tecnológico
- **Framework:** Next.js 16.3.0 (App Router, Turbopack)
- **React:** 19.2.4
- **Lenguaje:** TypeScript (strict)
- **Estilos:** Tailwind CSS v4 + CSS custom properties (tema oscuro)
- **Base de datos:** Supabase PostgreSQL (66 migraciones, pgvector para RAG)
- **Auth:** Supabase Auth + Google OAuth
- **Despliegue:** Vercel (auto-deploy desde `main`)
- **Path alias:** `@/` → `./src/`

## Dependencias Clave
- `@supabase/supabase-js` 2.105.4, `@supabase/ssr` 0.10.3
- `groq-sdk` 1.3.0, `googleapis` 171.4.0 (Google Drive API), `@google/generative-ai`
- `framer-motion` 12.38.0, `lucide-react` 1.14.0, `recharts` 3.8.1
- `react-hook-form` 7.81.0, `zod`, `@hookform/resolvers`
- `resend` 6.12.3 (emails), `date-fns` 4.1.0
- `pdf-parse`, `react-qr-code`

## Scripts Disponibles
| Script | Comando | Descripción |
|--------|---------|-------------|
| `dev` | `next dev` | Dev server con Turbopack |
| `build` | `next build` | Build de producción |
| `lint` | `eslint` | Linting |
| `sync-docs` | `node scripts/generateDocsContext.mjs` | PDFs → docsContext.ts (RAG keyword) |
| `extract-docs` | `node scripts/extractPdfText.js` | Extraer texto de PDFs a JSON |
| `ingest-vector` | `node --dns-result-order=ipv4first --env-file=.env.local scripts/ingestDocsToVector.mjs` | PDFs → pgvector embeddings (Gemini) |

(Nota: Se recomienda ejecutar las migraciones de BD 064-066 tras actualizaciones de schema)

## Herramientas de Desarrollo y Diagnóstico (scratch)
El directorio `scratch/` contiene scripts temporales para:
- **Diagnóstico:** `diagnose-qa.js` (QA), `diagnose-feedback.js` (feedback), `test-db.js`.
- **Migraciones/Testing:** Scripts `test-*.js` (ej. `test-column-existence.js`, `test-skills-columns.js`) para verificar esquemas de DB.
- **Gestión de Datos:** `analyze_videos.mjs`, `update_latest_videos.js`.

Estos scripts son fundamentales para validar cambios en el esquema de base de datos antes de aplicar migraciones.

## Estructura del Proyecto
```
D:\ITEC\
├── .agents/                    # Configuración de agentes IA
├── .env.local                  # Variables de entorno (API keys)
├── .github/                    # GitHub workflows
├── docs/                       # Documentación interna
├── public/                     # Assets estáticos (imágenes, logos)
│   ├── cicare/                 # Colección de fotos de Augusto Cicaré
│   └── sponsors/blanco/        # Logos de sponsors monocromo (marquesina landing, carga local vía fs)
├── scripts/                    # Scripts utilitarios (extracción PDF, generación docs)
├── src/
│   ├── app/                    # App Router (rutas públicas + dashboard + API)
│   │   ├── page.tsx            # Landing page (force-dynamic, logos sponsors vía fs con unstable_cache 1h, wrapper -translate-y-30px)
│   │   ├── layout.tsx          # Root layout (LanguageProvider + ChatWidgetWrapper lazy-loaded)
│   │   ├── globals.css         # Estilos globales y sistema de diseño
│   │   ├── acceso-pendiente/   # Página de acceso pendiente
│   │   ├── login/              # Login (Google OAuth)
│   │   ├── muro/               # Muro público de noticias
│   │   ├── acciones/           # Catálogo público de Acciones de Impacto
│   │   │   └── [id]/           # Detalle de acción individual
│   │   ├── articulo/           # Artículos públicos
│   │   │   └── [slug]/         # Detalle de artículo
│   │   ├── capacitaciones/     # Detalle de capacitación
│   │   │   └── [id]/
│   │   ├── clases/             # Aula virtual (streaming)
│   │   │   └── [id]/
│   │   ├── certificados/       # Pasaporte Digital (verificación QR)
│   │   │   └── [codigo]/
│   │   ├── eventos/            # Eventos presenciales (QR, acreditación, preguntas, nube, encuestas, pantalla)
│   │   │   ├── [id]/
│   │   │   ├── [id]/pantalla/          # Pantalla grande para proyector (bienvenida, encuestas, nube, Q&A)
│   │   │   ├── [id]/preguntar/
│   │   │   ├── [id]/pantalla-preguntas/
│   │   │   ├── [id]/pantalla-nube/
│   │   │   └── [id]/nube/
│   │   ├── mapa-productivo/    # Mapa Productivo (directorio empresas + talento)
│   │   ├── registro-mapa/      # Formulario registro Mapa Productivo
│   │   ├── sponsors/           # Portal del sponsor (por token)
│   │   │   └── [id]/
│   │   ├── votar/              # Votación en vivo para eventos
│   │   ├── dashboard/          # Panel de miembros (requiere auth)
│   │   │   ├── layout.tsx      # Sidebar + layout del dashboard
│   │   │   ├── page.tsx        # Redirige a /dashboard/muro
│   │   │   ├── muro/           # Muro de noticias interno
│   │   │   ├── reuniones/      # Sala de reuniones (Google Meet)
│   │   │   ├── drive/          # Nube de archivos (Google Drive)
│   │   │   ├── ideas/          # Buzón de ideas
│   │   │   ├── perfil/         # Perfil del miembro
│   │   │   ├── capacitaciones/ # Gestión de capacitaciones
│   │   │   ├── certificados/   # Gestión de certificados
│   │   │   ├── comunicacion/   # Centro de comunicaciones estratégicas (multicanal)
│   │   │   ├── miembros/       # Gestión de miembros (admin)
│   │   │   ├── encuestas/      # Encuestas en vivo (admin)
│   │   │   │   ├── [id]/pantalla/  # Pantalla de resultados
│   │   │   │   └── analytics/  # Analíticas de encuestas
│   │   │   ├── eventos/        # Sistema de preguntas en vivo (admin)
│   │   │   │   └── [id]/moderacion/ # Moderación de preguntas
│   │   │   ├── eventos-presenciales/ # Crear/modificar eventos (admin)
│   │   │   │   ├── herramientasActions.ts # Toggle herramientas, modo pantalla, concepto nube
│   │   │   │   ├── semaforoActions.ts # Voto negativo, obtener estado, reiniciar semáforo
│   │   │   │   └── [id]/       # Panel del orador
│   │   │   ├── nubes/          # Gestión de nubes de palabras (admin)
│   │   │   ├── prensa/         # Gestión de medios de prensa (admin)
│   │   │   ├── prensaNews/     # Gacetillas de prensa (admin)
│   │   │   ├── sponsors/       # Gestión de sponsors (admin)
│   │   │   ├── sponsorsNews/   # Muro sponsors (admin)
│   │   │   ├── settings/       # Ajustes del sitio (admin)
│   │   │   ├── entrenamiento-asistente/ # Entrenamiento del asistente IA (admin)
│   │   │   ├── videoteca/      # Gestión de videos (admin)
│   │   │   ├── streaming/      # Streaming (admin)
│   │   │   ├── ai/             # Procesador IA (transcripciones)
│   │   │   ├── acciones/nueva/ # Crear nueva acción
│   │   │   ├── eventos-presenciales/[id]/ # Editar evento presencial
│   │   │   └── encuestas/[id]/pantalla/   # Pantalla de resultados de encuesta
│   │   └── api/                # API routes
│   │       ├── asistente/      # Chat IA principal (OpenRouter + HuggingFace fallback)
│   │       │   └── feedback/   # Feedback de respuestas del asistente
│   │       ├── chat/           # Chat legacy (Groq)
│   │       │   └── guardar/    # Guardar conversación
│   │       ├── news/process/   # Procesamiento IA de noticias multicanal
│   │       ├── news-comments/  # Comentarios en noticias
│   │       ├── press-news/     # Feed gacetillas (GET)
│   │       ├── sponsors-news/  # Feed sponsors (GET)
│   │       ├── eventos/registro/ # Registro a eventos presenciales
│   │       ├── streaming/status/ # Estado streaming en vivo (site_settings, cache 30s)
│   │       ├── ideas/          # Envío de ideas (formulario público)
│   │       └── news/           # Procesamiento de noticias
│   ├── auth/                   # Auth routes
│   │   ├── callback/           # Intercambio código OAuth por sesión
│   │   └── signout/            # Cerrar sesión
│   ├── components/
│   │   ├── landing/             # Componentes de landing page
│   │   │   ├── Navbar.tsx       # Navegación principal
│   │   │   ├── HeroSection.tsx  # Hero con headline animado y CTAs
│   │   │   ├── AboutSection.tsx # Acerca de ITEC
│   │   │   ├── ImpactSection.tsx # Métricas de impacto (server)
│   │   │   ├── ImpactSectionClient.tsx # Métricas con animaciones cliente
│   │   │   ├── ComisionesSection.tsx  # Grid de comisiones activas
│   │   │   ├── IdeasSection.tsx # CTA del buzón de ideas
│   │   │   ├── VideotecaSection.tsx   # Videoteca destacada
│   │   │   ├── StreamingPlayer.tsx # Reproductor YouTube en vivo (Hero, convierte URL a embed)
│   │   │   ├── Footer.tsx       # Footer del sitio
│   │   │   └── FloatingLanguageSelector.tsx # Selector flotante ES/EN/PT (bottom 59px, fade out al scroll)
│   │   ├── home/               # Componentes de la landing (server-driven)
│   │   │   ├── SponsorHeaderBar.tsx # Marquesina infinita de sponsors (fixed bottom, fade out al scroll)
│   │   │   ├── NuestrosSociosSection.tsx # Sección "NUESTROS SOCIOS" (client, grids dinámicas por tier + modal)
│   │   │   └── SponsorModal.tsx  # Modal de detalle de sponsor (badge tier, reseña, email, web)
│   │   ├── comunicacion/        # Comunicación multicanal
│   │   │   ├── NewsWallMulticanal.tsx       # Muro con tabs: Público/Miembros/Sponsors/Prensa
│   │   │   ├── NewsFlashMulticanalEditor.tsx # Editor multicanal con IA
│   │   │   ├── ComunicacionTabs.tsx         # Tabs de comunicación
│   │   │   ├── NotasMulticanalList.tsx      # Lista de notas publicadas
│   │   │   └── ActionManagementList.tsx     # Lista de acciones
│   │   ├── chat/                # Widget flotante del asistente IA
│   │   │   ├── ChatWidget.tsx   # Widget visible en páginas públicas
│   │   │   ├── ChatWidget.css   # Estilos del widget
│   │   │   └── ChatWidgetWrapper.tsx # Wrapper condicional (oculta en rutas de eventos)
│   │   ├── capacitaciones/      # Encuestas en vivo
│   │   │   ├── LivePoll.tsx     # Votación en tiempo real
│   │   │   └── actions.ts       # voteLivePollAction() con cookie dedup
│   │   ├── acciones/            # Registro a acciones
│   │   │   └── ActionRegistrationForm.tsx
│   │   ├── reuniones/           # Salas de reuniones
│   │   │   └── GeneralMeetingRoom.tsx
│   │   ├── auth/                # Autenticación
│   │   │   ├── LoginClientContent.tsx  # Login Google OAuth
│   │   │   └── MembersAccessButton.tsx # Botón de acceso en navbar
│   │   ├── dashboard/           # Sidebar del dashboard
│   │   │   ├── sponsors/
│   │   │   │   └── SponsorRegistrationForm.tsx # Formulario alta sponsors
│   │   │   └── SidebarIdeasLink.tsx    # Link con badge de ideas pendientes
│   │   ├── ideas/               # Formulario público de ideas
│   │   │   └── PublicIdeasForm.tsx
│   │   └── prensa/              # Gestión de prensa
│   │       ├── SendGacetillaModal.tsx   # Modal envío gacetillas por email
│   │       └── PrensaEnviosHistoryModal.tsx # Historial de envíos
│   ├── services/
│   │   ├── auth.ts             # getCurrentMember(), isAdmin()
│   │   ├── ai.ts               # Procesamiento con IA (OpenRouter), embeddings (Gemini), auditoría
│   │   ├── admin.ts            # CRUD de miembros, prompts IA
│   │   ├── news.ts             # News multicanal (getAllMulticanalNewsFlashes, etc.)
│   │   ├── drive.ts            # Google Drive: listFolderFiles()
│   │   ├── videos.ts           # CRUD de videos
│   │   ├── actions.ts          # Acciones públicas
│   │   ├── sponsorReport.ts    # Generación de reportes de impacto con IA
│   ├── lib/
│   │   ├── supabase/           # Clientes Supabase (server, browser, admin)
│   │   ├── rag/                # RAG cascade (P1-P4), conversaciones guardadas
│   │   ├── eventos/            # Lógica compartida de eventos (semáforo de comprensión — DRY)
│   │   │   └── semaforo.ts     # calcularEstadoSemaforo() + tipos EstadoSemaforo/SemaforoResultado
│   │   ├── drive.ts            # Configuración de carpetas Drive por comisión
│   │   ├── email.ts            # Servicio de emails con Resend
│   │   ├── email/              # Templates HTML de emails
│   │   ├── docsContext.ts      # Contexto institucional auto-generado para asistente IA
│   │   └── docsContext.json    # Fallback estático de contexto
│   ├── types/
│   │   └── database.ts         # Tipos completos de la DB
│   ├── locales/
│   │   └── dictionary.ts       # Traducciones ES/EN/PT (context-based i18n)
│   ├── contexts/
│   │   └── LanguageContext.tsx  # Contexto de idioma
│   └── proxy.ts                # Next.js middleware (auth, protección de rutas)
├── supabase/
│   ├── .temp/                                  # Configuración de agentes IA
│   └── migrations/                             # Migraciones de base de datos
│       ├── 064_streaming_config.sql            # Keys streaming_active / streaming_youtube_url en site_settings
│       ├── 065_update_sponsors_table.sql       # Schema sponsors actualizado
│       ├── 066_sponsors_publicos_rpc.sql       # RPC obtener_sponsors_publicos (campos seguros, security definer)
│       └── fix_storage_policies.sql            # Políticas RLS Storage
├── AGENTS.md                   # Instrucciones para agentes IA (Next.js)
├── CLAUDE.md                   # Instrucciones para Claude
├── ITEC_CODEGUIDE.md           # Esta guía
├── README.md                   # Readme del proyecto
├── next.config.ts              # Configuración Next.js
├── package.json                # Dependencias y scripts
├── postcss.config.mjs          # Config PostCSS
├── eslint.config.mjs           # Config ESLint
├── tsconfig.json               # Config TypeScript
└── vercel.json                 # Config despliegue Vercel
```

---

## Sistema de Autenticación

1. **Supabase Auth** con Google OAuth como provider principal.
2. **Pre-aprobación:** Los emails deben estar en tabla `allowed_emails` para auto-aprobarse. Si no, quedan `status = 'pendiente'`.
3. **Trigger `handle_new_user()`** en Postgres: al crear usuario en `auth.users`, crea registro en `members`, verifica `allowed_emails`, asigna rol y comisión.
4. **Proxy middleware (`proxy.ts`):** Protege `/dashboard/*`, redirige no-auth a `/login`, pending a `/acceso-pendiente`.
5. **Roles y permisos:**
   - `admin` — Acceso total, todas las herramientas del dashboard
   - `coordinador` — Similar a admin, limitado a su comisión
   - `miembro` — Dashboard básico (muro, perfil, drive, reuniones, ideas)
   - `colaborador` — Acceso restringido
6. **Server Components** usan `getCurrentMember()` para obtener el miembro actual.
7. **Server Actions** (`'use server'`) también usan `getCurrentMember()` y verifican `member.role === 'admin'` para acciones administrativas.
8. **RLS (Row-Level Security):** Las tablas usan políticas de seguridad de Supabase basadas en auth.uid() y roles.

---

## Seguridad del Sitio

### Autenticación y Autorización
- **Supabase Auth** con Google OAuth como único provider. No hay login por contraseña.
- **Pre-aprobación obligatoria:** Emails deben estar en `allowed_emails` para auto-aprobarse. Usuarios sin pre-aprobación quedan `status = 'pendiente'` con acceso restringido.
- **Trigger `handle_new_user()`:** Asigna rol y comisión automáticamente al registrarse. No permite auto-asignación de roles.
- **Proxy middleware (`proxy.ts`):** Protege rutas `/dashboard/*`, redirige no-auth a `/login`, pending a `/acceso-pendiente`.

### Control de Acceso por Roles
| Rol | Acceso | Restricciones |
|-----|--------|---------------|
| `admin` | Total | Acceso completo a todas las herramientas |
| `coordinador` | Amplio | Limitado a su comisión |
| `miembro` | Básico | Muro, perfil, drive, reuniones, ideas |
| `colaborador` | Restringido | Solo lectura en áreas específicas |

### Server Actions — Seguridad
- Todas las Server Actions verifican `getCurrentMember()` antes de ejecutar.
- Acciones administrativas (toggle herramientas, reiniciar semáforo, actualizar concepto nube) requieren rol `admin` o `coordinador`.
- Ejemplo patrón seguro:
  ```typescript
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) {
    return { success: false, error: 'No autorizado' }
  }
  ```

### Row-Level Security (RLS)
- Todas las tablas críticas usan políticas RLS de Supabase.
- Las políticas filtran por `auth.uid()` y el rol del miembro en `members`.
- Las tablas de eventos presenciales (`evento_semaforo_votos`, `eventos_asistentes`, etc.) permiten INSERT anónimo (sin login) pero restringen DELETE/UPDATE a admins.
- **Migración 056:** Corrige políticas excesivamente permisivas en `clases_virtuales`, `clase_interacciones`, `certificados_digitales` (antes `USING (true)` permitía CRUD anónimo). Ahora escritura restringida a admin/coordinador.

### Storage (sponsors-logos)
- **Bucket:** `sponsors-logos` (público)
- **Políticas RLS:**
  - `SELECT`: Lectura pública (`USING bucket_id = 'sponsors-logos'`)
  - `INSERT`: Escritura autenticada para administradores/coordinadores (`WITH CHECK` + rol check)

### Datos Anónimos en Eventos
- **Identificación por dispositivo:** `localStorage` almacena un `dispositivo_id` UUID sin login.
- **Un voto por dispositivo:** Encuestas usan cookie-based dedup por `questionId`. Semáforo no tiene dedup server-side (votos append-only por diseño v3).
- **Límite de 25 caracteres** en palabras de nube de ideas para prevenir abuso de almacenamiento.

### Seguridad de la IA
- **Auditoría de respuestas** (`auditarRespuestaIA()`): 4 categorías de detección vía regex:
  1. Menciones prohibidas (palabras bloqueadas)
  2. Exposición de rutas internas del sistema
  3. Lenguaje informal o fuera de tono
  4. Uso de palabras temporales relativas
- Violaciones se registran en `ai_auditoria_violaciones` para monitoreo.
- **Palabras prohibidas en asistente:** "hoy", "ayer", "mañana", "che", "viste", "pibe".
- **No se exponen API keys** en el cliente. Todas las llamadas a IA se hacen desde server-side o API routes.
- **Mensajes de error sanitizados:** Los errores de providers IA (OpenRouter, HuggingFace) no exponen detalles internos al cliente. Solo se loguean códigos de estado en server-side.

### Tokens y Credenciales
- **Supabase anon key** (pública): Solo lectura de datos públicos, filtrada por RLS.
- **Service role key** (servidor): Solo se usa en Server Components y API routes, nunca en el cliente.
- **Sponsors `private_token`:** UUID único por sponsor para acceso a portal exclusivo. No se expone en URLs públicas.
- **Google Service Account:** Almacenada en `site_settings` (no en `.env.local`) para permitir rotación sin redeploy.

### Headers de Seguridad
- **CSP (Content Security Policy):** Configurado en `next.config.ts` para restringir orígenes de scripts, estilos y frames.
- **X-Frame-Options:** Previene clickjacking en páginas sensibles.
- **Rate limiting:** Implementado en endpoints de IA (`/api/asistente`) para prevenir abuso.

### Vulnerabilidades Conocidas y Mitigaciones
- **localStorage como identidad:** Aceptado como trade-off para UX sin login. No se almacenan datos sensibles.
- **Semáforo sin dedup server-side:** Por diseño v3 (anonimato total). Un usuario puede enviar múltiples votos cada 5s. Mitigado por el contexto del evento (presencial, corto alcance).
- **ChatWidget en rutas de eventos:** Oculto condicionalmente via `ChatWidgetWrapper` para no interferir con herramientas de eventos en vivo.

### Recomendaciones para Nuevos Desarrollos
1. **Nunca** exponer API keys o secrets en el cliente o en `localStorage`.
2. **Siempre** usar `getCurrentMember()` en Server Actions antes de mutar datos.
3. **Usar RLS** en todas las tablas nuevas. No confiar solo en la validación de la aplicación.
4. **Auditar** cualquier endpoint público que acepte datos del usuario.
5. **No deshabilitar** RLS en migraciones sin aprobación explícita.
6. **Loggear** intentos de acceso no autorizado en `ai_auditoria_violaciones` o tablas similares.

---

## Base de Datos — Tablas Principales

### Core
| Tabla | Descripción | Campos clave |
|-------|-------------|--------------|
| `members` | Perfiles de usuario | `id(uuid PK→auth.users)`, `full_name`, `email(UNIQUE)`, `avatar_url`, `role`(admin\|coordinador\|miembro\|colaborador), `status`(activo\|inactivo\|pendiente), `bio`, `linkedin_url`, `phone`, `join_date`, `frase_itec`, `tareas_itec` |
| `commissions` | Grupos de trabajo | `id(uuid PK)`, `name`, `slug(UNIQUE)`, `description`, `icon`, `color`, `is_active`, `coordinator_id(FK→members)`, `meet_link`, `drive_folder_id` |
| `commission_members` | Relación miembros-comisiones | `commission_id(FK→commissions)`, `member_id(FK→members)`, `joined_at`, `is_coordinator` — Unique(commission_id, member_id) |
| `site_settings` | Configuración global | Clave-valor para settings del sitio (Google service account, Drive root folder, etc.) |
| `allowed_emails` | Emails pre-aprobados | `email(UNIQUE)`, `role`, `commission_id` |

### Noticias y Comunicación (Multicanal)
| Tabla | Descripción |
|-------|-------------|
| `news_flashes` | Tabla principal de noticias con campos: `titulo`, `commission_id`, `author_id`, `original_text`, `summary`, `flash_text`, `source_type`, `is_published`, `tags`, `texto_publico`, `texto_miembros`, `texto_sponsors`, `texto_medios`, `datos_crudos`, `para_publico`, `para_miembros`, `para_sponsors`, `para_medios`, `media_urls(jsonb)` |
| `notas_publico` | Notas para audiencia pública |
| `notas_miembros` | Notas para miembros |
| `notas_sponsors` | Notas para sponsors |
| `notas_medios` | Notas para prensa/medios |
| `notas_generadas` | Notas generadas por IA |
| `news_media` | Recursos multimedia de noticias |
| `public_articles` | Artículos publicados con slugs |
| `news_comments` | Comentarios en noticias |

### Acciones y Eventos
| Tabla | Descripción |
|-------|-------------|
| `itec_actions` | Acciones de impacto (capacitacion\|evento_social\|divulgacion) con `title`, `description`, `type`, `status`, `target_audience`, `capacity`, `cost`, `start_date`, `end_date`, `location`, `thumbnail_url`, `tags(text[])`, `responsible_id`, `commission_id`, `materials_urls(text[])`, `media_urls(text[])` |
| `action_registrations` | Inscripciones a acciones públicas |
| `eventos` | Eventos presenciales con `herramientas_activas` (JSONB: encuestas, preguntas, nube, semáforo), `modo_pantalla_gigante`, `semaforo_last_reset_at`, `nube_concepto` |
| `eventos_asistentes` | Asistentes a eventos presenciales |
| `evento_preguntas` | Preguntas para oradores (con sistema de likes) |
| `evento_preguntas_colaborador` | Colaboración en preguntas |
| `evento_preguntas_likes` | Likes en preguntas de eventos |

### Sponsors
| Tabla | Descripción | Campos clave |
|-------|-------------|--------------|
| `sponsors` | Organizaciones sponsor | `id(PK)`, `name`, `tier`(platino\|oro\|plata\|bronce\|standard), `rubro`, `resena`, `website_url`, `contacto_nombre`, `contacto_telefono`, `email`, `logo_monocromo_url`, `logo_color_url`, `is_active`, `private_token(UNIQUE)` |
| `sponsor_reports` | Reportes de impacto generados por IA para sponsors | |
| `sponsors_medios` | Medios/sponsors para distribución de prensa | |

### Encuestas
| Tabla | Descripción |
|-------|-------------|
| `polls` | Encuestas en vivo para eventos |
| `poll_questions` | Preguntas dentro de encuestas |
| `poll_options` | Opciones de respuesta |
| `poll_votes` | Votos emitidos |

### IA y Asistente
| Tabla | Descripción |
|-------|-------------|
| `ai_prompt_settings` | System prompts dinámicos para modelos IA (keyed por `clave_prompt`) |
| `ai_auditoria_violaciones` | Registro de violaciones en respuestas IA (4 categorías regex) |
| `asistente_feedback` | Feedback de usuarios con embeddings para búsqueda semántica |
| `asistente_aprendizajes` | Patrones aprendidos de interacciones |
| `asistente_embeddings` | Embeddings vectoriales para RAG |
| `saved_conversations` | Conversaciones guardadas con embeddings (búsqueda semántica P4) |
| `chat_conocimiento` | Base de conocimiento de interacciones |
| `training_docs` | Documentos de entrenamiento del asistente (en Storage bucket) |
| `documents` | **pgvector** — Chunks de documentos con embeddings para búsqueda semántica P1. Schema: `id(uuid)`, `content(text)`, `embedding(vector(768))`, `metadata(jsonb)`. RPC: `match_documents(query_embedding, match_threshold, match_count)` |
| `api_settings` | Configuración de API keys rotatable sin redeploy (key/value) |

### Aula Virtual
| Tabla | Descripción |
|-------|-------------|
| `clases_virtuales` | Sesiones de clases virtuales con estado de streaming |
| `clase_interacciones` | Interacciones en vivo (chat, mano alzada, modómetro) vía Supabase Broadcast |

### Certificados
| Tabla | Descripción |
|-------|-------------|
| `certificados_digitales` | Certificados digitales verificables por QR con `codigo(UNIQUE)`, `titulo`, `alumno_nombre`, `fecha`, `competencias(text[])`, `horas_catedra`, `thumbnail_url` |

### Capacitaciones
| Tabla | Descripción |
|-------|-------------|
| `trainings` | Sesiones de entrenamiento/capacitación |
| `entrenamiento_acciones` | Acciones vinculadas a entrenamientos |
| `polls` (capacitaciones) | Encuestas en vivo para capacitaciones (con `training_id`) |

**LivePoll (`capacitaciones/LivePoll.tsx`):** Componente de votación en tiempo real. Usa `voteLivePollAction()` (server action) con cookie-based dedup (`livepoll_voted_{pollId}`) para prevenir votos duplicados. Lee el conteo actual de votes antes de incrementar para evitar race conditions.

### Mapa Productivo
| Tabla | Descripción |
|-------|-------------|
| `mapa_empresas` | Empresas registradas en el Mapa Productivo |
| `mapa_empresas_telefono` | Teléfonos de empresas del mapa |
| `alumnos_talentos` | Perfiles de talento estudiantil registrados en el mapa |

### Eventos — Tables Adicionales
| Tabla | Descripción |
|-------|-------------|
| `eventos_encuestas` | Encuestas dentro de eventos con opciones y votos |
| `eventos_encuestas_opciones` | Opciones de respuesta de encuestas de evento |
| `eventos_encuestas_votos` | Votos emitidos en encuestas de evento |
| `evento_nubes` | Configuración de nubes de palabras múltiples por evento |
| `evento_nube_palabras` | Palabras enviadas a cada nube |
| `evento_semaforo_votos` | Votos del semáforo de comprensión (anónimos, por evento) |

### Otras
| Tabla | Descripción |
|-------|-------------|
| `ideas` | Ideas/comentarios de la comunidad |
| `videos` | Videoteca (YouTube) |
| `prensa_envios_log` | Log de envíos de prensa por email |
| `medios_prensa` | Medios de comunicación registrados |
| `sponsor_reportes` | Reportes de impacto generados por IA para sponsors |
| `sponsor_reportes_acciones` | Acciones registradas en reportes de sponsor |

---

## Sistema de Noticias Multicanal (Feature Central)

El flujo de creación de noticias funciona así:
1. **`NewsFlashMulticanalEditor`** — Editor que recibe datos crudos y los envía al backend.
2. **`/api/news/process`** — Llama a `generateMulticanalNews()` en `services/ai.ts` que usa Gemini (`gemini-flash-latest`) para generar 4 textos diferentes para 4 canales (público, miembros, sponsors, medios) usando un prompt de agente de prensa.
3. Los textos generados se guardan en `news_flashes` con los campos `texto_publico`, `texto_miembros`, `texto_sponsors`, `texto_medios`.
4. También se crean registros en `notas_publico`, `notas_miembros`, `notas_sponsors`, `notas_medios`.
5. **`NewsWallMulticanal`** — Componente de visualización con tabs: Público, Muro Noticias (interno), Muro Sponsors, Prensa.
6. **Targets por canal:**
   - **Público** (`para_publico`) — Noticias visibles en `/muro` para toda la comunidad
   - **Miembros** (`para_miembros`) — Comunicación interna del dashboard
   - **Sponsors** (`para_sponsors`) — Contenido exclusivo para sponsors vía API
   - **Medios** (`para_medios`) — Gacetillas para prensa vía API

---

## Sidebar del Dashboard (`layout.tsx`)

- **Nav principal** (todos los miembros): Muro, Sala Reuniones, Aula Virtual, Pasaporte Digital, Buzón Ideas, Mi Perfil, Nube Archivos, Mapa Productivo, Capacitaciones.
- **HERRAMIENTAS** (solo admin): Items sueltos + submenús colapsables (`<details>`):
  - **Prensa** (cyan): Gacetillas, Gestión de Prensa
  - **Sponsors** (amber): Muro Sponsors, Gestión de Sponsors
  - **Herramientas para Eventos** (púrpura): Encuestas, Sistema Preguntas, Nube Ideas, Semáforo de Comprensión, Crear Evento, Editar Evento. Cada herramienta se activa/desactiva individualmente por evento via `herramientas_activas` (JSONB, claves: `encuestas`, `preguntas`, `nube`, `semaforo`).
- Usa `scroll={false}` en todos los links para mantener posición al navegar.
- Diseño responsive con color-coding por sección.
- Los badges muestran conteos de items pendientes (ej. comentarios no leídos).

---

## Sistema de IA — Proveedores y Servicios

### REGLA DE ORO: Modelos Gratuitos
> **Todos los endpoints del asistente ITEC DEBEN usar modelos FREE de OpenRouter.**
> Nunca usar modelos de pago (deepseek/deepseek-chat, etc.) en producción.
> El modelo `openrouter/free` es un router automático que selecciona entre 14+ modelos gratuitos disponibles.

### Proveedores de IA — Distribución por tarea

| Proveedor | Modelo | Uso asignado |
|-----------|--------|-------------|
| **Google Gemini** | `gemini-flash-latest` | **Edición de texto exclusivo**: resúmenes, flashes, noticias multicanal, videos (`services/ai.ts`). Tier gratuito. |
| **Groq** | `llama-3.3-70b-versatile` | **Asistente ITEC primario** (`/api/asistente`) + chat legacy (`/api/chat`). Tier gratuito. |
| **OpenRouter** | `nvidia/nemotron-nano-9b-v2:free` | **Asistente ITEC fallback** (`/api/asistente`). Tier gratuito. |
| **Ollama** (self-hosted) | `llama3.2:latest` en `ai.itecsaladillo.org.ar` | **Último recurso** (caído). Self-hosted = gratuito. |
| **HuggingFace** | `all-MiniLM-L6-v2` | Embeddings fallback (384-dim, zero-padded a 768) |

### Arquitectura de proveedores

```
┌─────────────────────────────────────────────────┐
│  Asistente ITEC (/api/asistente)                │
│  Groq (llama-3.3-70b) → OpenRouter (nemotron)  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Edición de texto (services/ai.ts)              │
│  Gemini (gemini-flash-latest) exclusivo         │
│  → processWithAI, generateFlash,                │
│    generateMulticanalNews, generateVideoSummary │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Embeddings (services/ai.ts)                    │
│  Gemini (gemini-embedding-001) → HuggingFace    │
└─────────────────────────────────────────────────┘
```

### Servicios de IA (`src/services/ai.ts`)
| Función | Propósito |
|---------|-----------|
| `processWithAI()` | Genera resúmenes + action items de transcripciones de reuniones |
| `generateFlash()` | Crea flashes noticiosos cortos para el muro interno |
| `generateExecutiveSummary()` | Resúmenes ejecutivos a partir de notas |
| `generateActionItems()` | Extrae items de acción de textos |
| `generateMulticanalNews()` | Genera contenido para 4 audiencias (público, miembros, sponsors, medios) |
| `generateVideoSummary()` | Resume videos de YouTube |
| `generarEmbedding()` | Genera embeddings vía Gemini o HuggingFace |
| `buscarFeedbacksSimilares()` | Búsqueda semántica de feedbacks similares |
| `auditarRespuestaIA()` | Audita respuestas por violaciones de policy (4 categorías) |

### RAG Cascade (`src/lib/rag/ragCascade.ts`)
Sistema de recuperación de **5 niveles** con scoring por solapamiento de tokens (estilo Jaccard):

| Nivel | Fuente | Threshold | Método |
|-------|--------|-----------|--------|
| **P1** | pgvector `documents` | >= 0.20 | Gemini embedding + cosine similarity via `match_documents` RPC |
| **P2** | Documentos locales (`DOCS_CONTEXT`) | >= 0.40 | Token overlap scoring (Jaccard-style) |
| **P3** | Supabase Storage `training-docs` | >= 0.35 | Token overlap on downloaded .txt/.md/.json (**caché en memoria 5 min + dedup de descargas concurrentes** — el bucket se consulta 1 vez por ventana, no por request) |
| **P4** | Conversaciones guardadas | any | Semantic search via `buscar_conversaciones_similares` RPC |
| **P5** | DuckDuckGo web search | any | Instant Answer API (sin API key) |
| **Soft fallback** | Mejor resultado | any | Retorna el mejor aunque esté bajo thresholds |

- **Chunk size:** 900 chars, **overlap:** 120 chars, **max context:** 3200 chars
- Compatible con Edge Runtime (sin dependencias Node pesadas)
- **Integrado en `/api/asistente`**: Se ejecuta después de las queries de DB y se inyecta al system prompt
- **Ingesta de documentos:**
  - `npm run sync-docs` → PDFs → `docsContext.ts` (keyword RAG, nivel P2)
  - `npm run ingest-vector` → PDFs → chunking → Gemini embeddings → tabla `documents` (pgvector, nivel P1)

### Asistente IA (`/api/asistente`)
- **Provider:** Groq (`llama-3.3-70b-versatile`) → OpenRouter (`nvidia/nemotron-nano-9b-v2:free`) fallback
- **RAG integrado:** Llama a `recuperarContextoRAG()` para inyectar contexto semántico
- **Contexto dinámico de DB en paralelo:** prompt maestro, staff, noticias, comisiones, actividades, artículos
- **Timeout:** 60s (modelos gratuitos pueden ser más lentos)
- Detecta comandos explícitos de guardado y auto-guarda cada 10 mensajes
- System prompt: enforce estilo ITEC (técnico, humano, vanguardista)
- **Auditoría de IA** (`auditarRespuestaIA()`) — 4 categorías de detección vía regex:
  1. Menciones prohibidas (palabras bloqueadas → reemplaza respuesta)
  2. Exposición de rutas internas del sistema
  3. Lenguaje informal o fuera de tono
  4. Uso de palabras temporales relativas
- Violaciones se registran en `ai_auditoria_violaciones`
- **Sistema de Feedback** (`/api/asistente/feedback`):
  - Usuarios califican respuestas (muy_util, util, no_util, error)
  - Ollama sintetiza tema_principal y lo_mas_util
  - Genera embeddings para búsqueda semántica
  - Guarda en `asistente_feedback`
- **Lazy Groq:** El cliente Groq en `/api/chat` usa lazy initialization para evitar error de build cuando falta `GROQ_API_KEY`

### Constantes de IA (`src/lib/ai/constants.ts`)
- **`FALLBACK_PROMPT`**: System prompt por defecto del asistente cuando no hay configuración en DB. Define identidad, conocimiento sobre ITEC/Cicaré, y reglas de comportamiento.
- **`ANTI_HALLUCINATION_RULES_STRICT`**: Reglas estrictas para RAG — solo responder con información del contexto recuperado.
- **`ANTI_HALLUCINATION_RULES_FLEXIBLE`**: Reglas flexibles — priorizar contexto RAG, luego artículos, luego conocimiento general.

### Conversaciones Guardadas (`src/lib/rag/conversacionesGuardadas.ts`)
- **Detección de comandos:** Patrones regex en español para detectar "guardar conversación", "guardar esto", etc.
- **Auto-guardado:** Se activa después de 10 mensajes y se repite cada 10 mensajes.
- **Persistencia:** Genera embedding del historial y guarda en `saved_conversations`.
- **Recuperación (P4):** Busca conversaciones pasadas similares a la query actual usando similitud coseno.

---

## Páginas Públicas — Detalle Funcional

### Landing Page (`/`)
Secciones: Hero (logo + fotos Cicaré + frase aleatoria de 3 opciones que cambia en cada carga), Navbar con navegación completa, Métricas de Impacto (contadores animados), Videoteca (videos de YouTube con resúmenes IA), Sección "Acerca de", Comisiones (grid visual con colores), Buzón de Ideas (formulario), Footer completo.

Características recientes de la landing:
- **Sección "NUESTROS SOCIOS"** — `NuestrosSociosSection.tsx` (client): grillas dinámicas de logos agrupadas por nivel de sponsoreo (platino, oro, plata, bronce, standard), en columna derecha del título (estilo columna izquierda como Nuestro Equipo). Los datos vienen del RPC `obtener_sponsors_publicos` (solo sponsors activos, campos seguros — migración 066). Grillas dinámicas según cantidad de logos (2 a 10 columnas), alturas estandarizadas por nivel (`BASE_H=120` × pct: platino 100% con glow ámbar, oro 80%, plata 55%, bronce 35%, standard 10%). Tiers superiores (platino/oro) en columna derecha, inferiores (plata/bronce/standard) a ancho completo debajo. Click en un logo abre `SponsorModal.tsx` (Framer Motion, badge de nivel, reseña, email, link al sitio web, cierre con Escape). Título en tipografía Impact con "Socios" en gradient.
- **Sección "NUESTRO EQUIPO"** — En `AboutSection.tsx`: título en columna izquierda (tipografía Impact, "Equipo" con text-gradient) y fichas horizontales de miembros rodeándolo (estilo espejo de Nuestros Socios). Primeras 9 fichas en grid 3 columnas; desde la cuarta fila las fichas van a ancho completo (`lg:grid-cols-4/5`). Cada `MemberCard` horizontal (avatar circular, nombre, badge de rol, frase/bio) abre el modal de perfil del miembro al hacer click.
- **Streaming en vivo en Hero** — Si `streaming_active=true` y `streaming_youtube_url` están configurados en `site_settings`, el Hero muestra el reproductor YouTube en vivo (`StreamingPlayer.tsx`) en lugar de las palabras spotlight. Estado consultado via `/api/streaming/status` (público, cache 30s). El botón "Aula Virtual" también se enciende en rojo pulsante cuando hay una clase con `en_vivo=true` en `clases_virtuales` (Realtime).
- **Barra de sponsors (marquesina)** — `SponsorHeaderBar.tsx`: barra `fixed` al borde inferior con logos monocromo de sponsors en loop infinito. Los logos se leen del filesystem (`public/sponsors/blanco/`) en el server component de `page.tsx` envuelto en `unstable_cache` (Next.js, `revalidate: 3600` — 1 hora) con timestamp de mtime como cache-buster (`?v=...`). Fade out al hacer scroll (> 10px), velocidad de animación 70s, pausa al hacer hover.
- **Posicionamiento de elementos flotantes** — El contenido principal está desplazado `-translate-y-[30px]` para compensar la barra inferior. El widget del chat y el selector de idioma se anclan al viewport (`bottom: 59px`, selector en `right-6`), ambos con fade out al scroll.
- **Hydration-safe** — `page.tsx` usa `force-dynamic` + `revalidate = 0`; `SponsorHeaderBar` usa `suppressHydrationWarning` + `isMounted` para evitar el error de hidratación #418 (timestamps determinísticos del server, sin `Date.now()` en SSR).

### Muro de Noticias (`/muro`)
Muro público que muestra `notas_publico` publicadas. Incluye sistema de comentarios via `/api/news-comments`. Visualización con medios adjuntos (imágenes, videos).

### Mapa Productivo (`/mapa-productivo`)
Directorio interactivo del ecosistema productivo regional. Muestra beneficios para empresas y estudiantes, y guía paso a paso de cómo funciona la iniciativa. Las empresas/estudiantes se registran via `/registro-mapa` con formulario de doble perfil:
- **Empresa**: nombre, sector, contacto, necesidades, desafíos → datos en `mapa_empresas`
- **Estudiante**: escuela, especialidad, habilidades → datos en `alumnos_talentos`

### Acciones de Impacto (`/acciones`)
Catálogo público de acciones (capacitaciones, eventos sociales, divulgaciones científicas) con filtros por tipo. Cada acción tiene detalle (`/acciones/[id]`) con formulario de inscripción pública.

### Artículos (`/articulo`)
Artículos publicados con slugs amigables. Cada artículo (`/articulo/[slug]`) soporta contenido enriquecido.

### Aula Virtual (`/clases/[id]`)
Sala de clases virtuales interactiva con streaming en vivo:
- **Reproductor de video** simulado con controles de reproducción
- **Chat en tiempo real** via Supabase Broadcast
- **Modómetro** — Votación de comprensión en vivo: "Voy bien", "Me perdí", "Muy rápido"
- **Mano Alzada** — Sistema para pedir turno de palabra respetuosamente
- **Consola del Docente** — Cambia entre vista de chat/modómetro, reinicia votos, gestiona cola de preguntas
- **Simulación de roles** — Alterna entre vista alumno/docente para testing
- **Identificación por dispositivo** — localStorage anónimo
- Estado de streaming en tiempo real vía Supabase Realtime (`postgres_changes`)

### Certificados Digitales — Pasaporte Digital (`/certificados/[codigo]`)
Verificación pública de certificados digitales mediante código QR único. Muestra: nombre del alumno, título, fecha, competencias adquiridas, horas cátedra. Datos en `certificados_digitales`. SEO optimizado con meta tags para compartir en redes.

### Eventos Presenciales (`/eventos/[id]`)
Sistema completo de interacción en vivo:
- **QR de acreditación** — Los asistentes se acreditaban escaneando QR o completan formulario con nombre, email, teléfono, organización
- **Credencial por dispositivo** — Identificación por localStorage (sin login requerido)
- **Preguntas al orador** (`/preguntar`) — Los asistentes envían preguntas con sistema de likes, opción de anonimato
- **Pantalla de preguntas** (`/pantalla-preguntas`) — Moderador muestra preguntas aprobadas en pantalla grande
- **Nube de palabras** (`/nube`, `/pantalla-nube`) — Audiencia envía palabras a nubes colaborativas; soporta múltiples nubes activas por evento con límite de caracteres, normalización de diacríticos y desduplicación
- **Concepto de Charla dinámico** — El operador configura un concepto (`nube_concepto`) desde la Consola ITEC que se muestra en celulares y pantalla gigante en tiempo real vía Realtime
- **Encuestas** — Votación en tiempo real con resultados visibles, un voto por dispositivo
- **Semáforo de Comprensión** — Sistema de alertas anónimas desde celulares (v3, migración 054):
  - **Tabla `evento_semaforo_votos`:** Solo columnas `id(uuid)` + `evento_id(uuid FK)` + `created_at(timestamptz)`. Sin `visitor_id`, sin columna `voto` — cada fila ES un voto negativo. Append-only, sin UPDATE/DELETE.
  - **Botón "NO ENTIENDO, ME PERDÍ (Anonimo)"** en `eventos/[id]/page.tsx`: inserta fila en `evento_semaforo_votos`. Cooldown de 5s por dispositivo (solo client-side, sin server dedup).
  - **Cálculo de porcentaje:** `votosNegativos / Math.max(totalAcreditados, votosNegativos, 1) * 100`. El denominator seguro previene división por cero y maneja el caso de más votos que acreditados.
  - **Umbrales de estado:**
    - VERDE: < 30% de alertas
    - AMARILLO: 30–49% de alertas
    - ROJO: >= 50% de alertas
  - **Cálculo centralizado:** `calcularEstadoSemaforo()` en `src/lib/eventos/semaforo.ts` (DRY, ago 2026) — fuente única de verdad con tipos (`EstadoSemaforo` = `'VERDE' | 'AMARILLO' | 'ROJO'` en mayúsculas, `SemaforoResultado`), umbrales (VERDE < 30%, AMARILLO 30-49%, ROJO >= 50%) y cálculo con denominador seguro (`Math.max(total, votos, 1)` — previene división por cero y maneja más votos que acreditados). Retorna `{ estado, porcentaje, votosNegativos, totalAcreditados }`. Lo consumen: `semaforoActions.ts` (server), `PanelOradorClient.tsx`, `eventos/[id]/page.tsx` y `pantalla/page.tsx` (cliente). Módulo de funciones puras, compatible con Edge Runtime. Eliminadas las 4 copias duplicadas de `calcularEstadoLocal()`/`calcularEstado()` y los casts `(evento as any)`.
  - **Reset (`resetearSemaforo()`):** Requiere rol admin/coordinador. Actualiza `semaforo_last_reset_at` a `now()` en tabla `eventos`. NO borra votos — el COUNT filtra por `created_at >= resetAt`.
  - **3 suscripciones Realtime por cliente:**
    1. `evento_semaforo_votos` INSERT → incrementa contador optimista (consola) o recalcula desde DB (móvil/pantalla)
    2. `eventos` UPDATE (filtro `id=eq.{eventoId}`) → detecta cambio en `semaforo_last_reset_at` y recalcula
    3. `eventos_asistentes` INSERT/DELETE → actualiza denominator (solo consola y pantalla, NO móvil)
  - **Arquitectura:** 3 clientes independientes (móvil, consola orador, pantalla gigante) que suscriben los mismos canales Realtime y calculan estado localmente. El orador puede reiniciar desde `PanelOradorClient.tsx`.
  - **RLS:** SELECT e INSERT públicos (sin auth). Sin políticas UPDATE/DELETE (votos inmutables).
  - **Nota de tipo:** `HerramientasActivas` en `database.ts` incluye `semaforo: boolean` (junto a `encuestas`, `preguntas`, `nube`). `herramientasActions.ts` re-exporta el tipo canónico de `database.ts`; los componentes de eventos importan de `@/types/database` (sin interfaces locales duplicadas ni casts `as any`).
- **Big Screen Display** (`/pantalla`) — Pantalla completa para proyector con múltiples modos:
  - **Modo Bienvenida** — Código QR + conteo de asistentes
  - **Modo Encuestas** — Barras animadas con resultados en vivo
  - **Modo Nube de Palabras** — Visualización de palabras con concepto del operador + tamaño proporcional a frecuencia
  - **Modo Q&A** — Preguntas destacadas con más votos
  - Fondos animados con Framer Motion
- **Confirmación por email** — Email de bienvenida al registrarse via Resend

### Portal del Sponsor (`/sponsors/[id]`)
Acceso por token privado (`private_token`). Muestra contenido exclusivo para el sponsor, reportes de impacto generados por IA.

### Chat Widget Asistente ITEC
Widget flotante visible en todas las páginas públicas EXCEPTO en herramientas de eventos. Usa `ChatWidgetWrapper.tsx` que evalúa la ruta actual con `usePathname()` y oculta el widget en:
- `/eventos/*` (vistas móviles del evento, pantalla, preguntas, nube)
- `/dashboard/eventos-presenciales/*` (Consola ITEC)
- `/dashboard/eventos/*` (administración de eventos)

El wrapper usa el endpoint `/api/asistente` que integra **RAG cascade completo** (5 niveles) + contexto dinámico de DB (staff, noticias, comisiones, artículos). Interfaz tipo chat con historial, ID de sesión persistente, y avatar del asistente desde la DB. Posicionado a `bottom: 59px` (alineado con el selector de idioma), con fade out al hacer scroll.

### Soporte Multi-idioma
Sistema i18n basado en contexto React (`LanguageContext`) con diccionario en `src/locales/dictionary.ts`. Idiomas: Español, English, Português.

---

## Dashboard de Miembros — Detalle Funcional

### Muro (`/dashboard/muro`)
Noticias internas visibles solo para miembros (`notas_miembros`). Sistema de comentarios interno.

### Sala de Reuniones (`/dashboard/reuniones`)
Integración con Google Meet. Muestra links de reuniones por comisión. Acceso directo a salas.

### Nube de Archivos (`/dashboard/drive`)
Explorador de Google Drive integrado via Service Account. Muestra archivos organizados por carpeta de comisión. Usa `listFolderFiles()` y `getRecentFiles()`.

### Buzón de Ideas (`/dashboard/ideas`)
Gestión de ideas enviadas por la comunidad. Los miembros pueden ver, comentar y cambiar estado de ideas.

### Perfil (`/dashboard/perfil`)
Edición de perfil personal: nombre, bio, teléfono, LinkedIn, frase ITEC, tareas ITEC. Actualización via server action.

### Centro de Comunicaciones (`/dashboard/comunicacion`)
Herramienta estratégica de comunicación. Editor `NewsFlashMulticanalEditor` para crear noticias multicanal. Envía datos a `/api/news/process` que usa IA para generar 4 versiones.

### Procesador IA (`/dashboard/ai`)
Herramienta para pegar transcripciones de reuniones y generar automáticamente: resumen ejecutivo, action items, flash noticioso, artículo publicable.

### Entrenamiento del Asistente (`/dashboard/entrenamiento-asistente`)
Gestión de documentos de entrenamiento para el asistente IA. Subida de PDFs al bucket `training-docs` de Supabase Storage. Sincronización de contexto con `npm run sync-docs`.

### Streaming (`/dashboard/streaming`)
Centro de Transmisión & Streaming (admin/coordinador). Controla el estado del streaming en vivo: activar/desactivar (`setStreamingActive`) y configurar la URL de YouTube (`updateStreamingUrl`), persistidas en `site_settings` (keys `streaming_active`, `streaming_youtube_url`). Incluye guía de configuración para software de streaming (RTMP `rtmp://streaming.itec.edu.ar/live`) y fuentes de navegador. El estado se consume públicamente desde el Hero de la landing via `/api/streaming/status`.

### Videoteca (`/dashboard/videoteca`)
CRUD de videos de YouTube. Cada entrada incluye: título, descripción, URL, miniatura, resumen generado por IA.

### Gestión de Capacitaciones (`/dashboard/capacitaciones`)
CRUD de capacitaciones/acciones de impacto con dashboard de estadísticas. Creación de nuevas acciones via `/dashboard/acciones/nueva`.

### Certificados / Pasaporte Digital (`/dashboard/certificados`)
Gestión de certificados digitales emitidos a miembros y alumnos.

---

## Herramientas de Administrador

### Gestión de Miembros (`/dashboard/miembros`)
CRUD completo de miembros: aprobar/rechazar pendientes, asignar roles, asignar a comisiones, activar/desactivar.

### Gestión de Comisiones
Crear/editar comisiones con nombre, slug, descripción, icono, color, coordinador.

### Settings del Sitio (`/dashboard/settings`)
Configuración global: Google Service Account JSON, Drive root folder ID, y otras settings clave-valor.

### Prompts de IA (`/dashboard/entrenamiento-asistente`)
Configuración de system prompts dinámicos para cada modelo IA (keyed por `clave_prompt` en tabla `ai_prompt_settings`).

### Encuestas en Vivo (`/dashboard/encuestas`)
Creación de encuestas con preguntas y opciones. Pantalla de resultados en vivo (`/dashboard/encuestas/[id]/pantalla`). Analíticas avanzadas con Recharts en `/dashboard/encuestas/analytics`.

### Sistema de Preguntas (`/dashboard/eventos`)
Moderación de preguntas enviadas por la audiencia durante eventos. Aprobación, ordenamiento, destacar en pantalla.

### Eventos Presenciales (`/dashboard/eventos-presenciales`)
Creación de eventos con slug QR, fecha, ubicación, panel de oradores. Edición de eventos existentes via `/[id]`. Incluye: preacreditación, configuración de modos de pantalla (bienvenida, encuestas, nube, Q&A), gestión de herramientas activas por evento (encuestas, preguntas, nube, semáforo). El **Panel del Orador** (`PanelOradorClient`) gestiona:
- Switches individuales de herramientas en layout grid `2x2` responsive
- Modo de proyección de pantalla gigante (orden: Bienvenida → Encuestas → Preguntas → Nube)
- **Concepto de Charla** — Campo de texto para definir el concepto de la nube de ideas (se guarda vía `actualizarConceptoNube()` y se muestra en celulares/pantalla en tiempo real)
- **Semáforo de Comprensión** — Panel con estado visual (verde/amarillo/rojo), estadísticas de acreditados/alertas/porcentaje, botón de reinicio con auth check. El panel muestra las 3 columnas de semáforo, tarjetas de estadísticas, reglas de umbrales, y botón "Reiniciar" (requiere admin/coordinador). El toggle del semáforo se controla desde el grid `2x2` de herramientas activas.
- Conteo de asistentes acreditados en tiempo real (suscripción Realtime con manejo de INSERT y DELETE)

### Nubes de Palabras (`/dashboard/nubes`)
Gestión de nubes de palabras generadas durante eventos. Visualización y exportación.

### Gestión de Prensa (`/dashboard/prensa`)
CRUD de medios de prensa registrados. Envío de gacetillas por email via Resend. Historial de envíos en `prensa_envios_log`.

### Gacetillas de Prensa (`/dashboard/prensaNews`)
Creación y gestión de gacetillas. Distribución segmentada a medios registrados.

### Gestión de Sponsors (`/dashboard/sponsors`)
- CRUD completo de sponsors con niveles (platino, oro, plata, bronce, standard). 
- **Módulo de Alta:** Formulario integrado (`SponsorRegistrationForm`) para registro de nuevos socios con carga de logos, categorización, validaciones y navegación de retorno. Ahora se renderiza como modal controlado con props `onClose`/`onCreated` (evita el overlay manual en `SponsorsAdmin`); los campos opcionales del schema de `actions.ts` son `null`-ables explícitamente.
- Generación de reportes de impacto con IA (Ollama). Tokens privados únicos.

### Muro Sponsors (`/dashboard/sponsorsNews`)
Gestión de contenido exclusivo para sponsors. Noticias visibles en portal del sponsor.

### Creación de Acciones de Impacto (`/dashboard/acciones/nueva`)
Formulario para crear nuevas acciones de impacto (capacitaciones, eventos sociales, divulgaciones) con campos: título, descripción, tipo, audiencia, capacidad, costo, fechas, ubicación, tags, responsable, comisión.

---

## API Routes — Detalle

| Ruta | Método | Propósito | Input/Output |
|------|--------|-----------|--------------|
| `/api/asistente` | POST | Chat IA principal con RAG cascade + contexto DB | `{ mensaje, historial[], sessionId }` → `{ respuesta, guardado? }` |
| `/api/asistente/debug` | GET | Debug: verifica env vars + testea OpenRouter y Gemini | → `{ env, openRouter, gemini }` |
| `/api/asistente/test` | GET/POST | Test de OpenRouter directo | GET: env check. POST: `{ messages[] }` → `{ status, body }` |
| `/api/asistente/feedback` | POST | Feedback sobre respuestas del asistente | `{ message, response, rating, comment }` |
| `/api/chat` | POST | Chat legacy streaming via Groq + RAG cascade | `{ message, history[] }` → ReadableStream (SSE) |
| `/api/chat/guardar` | POST | Guardar conversación en base de conocimiento | `{ conversation[] }` |
| `/api/news/process` | POST | IA genera 4 versiones multicanal | `{ titulo, texto, commission_id }` |
| `/api/news-comments` | GET/POST | Comentarios en noticias | GET: `?newsFlashId=`. POST: `{ news_flash_id, content }` |
| `/api/ideas` | POST | Envío de ideas (formulario público) | `{ nombre, email, mensaje }` |
| `/api/press-news` | GET | Feed de gacetillas para prensa | → `notas_medios[]` |
| `/api/sponsors-news` | GET | Feed de notas para sponsors | → `notas_sponsors[]` |
| `/api/eventos/registro` | POST | Registro a evento + email bienvenida | `{ evento_id, nombre, email, telefono?, organizacion? }` |
| `/api/streaming/status` | GET | Estado del streaming en vivo (público, sin auth) | → `{ isActive, youtubeUrl }` desde `site_settings` (keys `streaming_active`, `streaming_youtube_url`). Cache: 30s |

---

## Integraciones Externas

### Supabase
- **Database:** PostgreSQL con 66+ migraciones, RLS policies
- **Auth:** Supabase Auth con Google OAuth, manejo de sesiones via cookies SSR
- **Storage:** 4 buckets: `article-media`, `avatars`, `training-docs`, `sponsors-logos`
- **Realtime:** Suscripciones `postgres_changes` para:
  - Estado de clases virtuales en vivo
  - Votos de encuestas, preguntas y nubes de palabras en eventos
  - Semáforo de comprensión (`evento_semaforo_votos` INSERT, `eventos` UPDATE para reset, `eventos_asistentes` INSERT/DELETE para conteo)
  - Concepto de nube dinámico (cambios en tabla `eventos`)
  - Conteo de asistentes acreditados (INSERT/DELETE en `eventos_asistentes`)
  - Badge "Aula en vivo" del Hero (cambios en `clases_virtuales`)
- **Supabase Broadcast:** Chat en tiempo real en aula virtual (`/clases/[id]`)

### Google Drive API
- Autenticación via Service Account (credenciales en `site_settings`)
- Carpetas organizadas por comisión (`drive_folder_id` en tabla `commissions`)
- Funciones: `listFolderFiles()`, `getRecentFiles()`
- Archivos visibles en el dashboard (`/dashboard/drive`)

### Google Gemini
- API para embeddings (`text-embedding-004`) — primario para RAG
- API para generación de texto (`gemini-flash-latest`) — edición de texto exclusiva
- Múltiples API keys configuradas como fallback chain (4 keys en `site_settings`)

### Resend (Emails)
- Email de bienvenida al aprobar membresía
- Email de confirmación de registro a eventos
- Distribución de gacetillas de prensa a medios registrados
- Template HTML en `src/lib/email/`

### Vercel
- Despliegue automático desde branch `main`
- Edge Runtime para API routes seleccionadas

---

## Convenciones de Código

### Server Components vs Client Components
- **Server Components** por defecto — toda página es server component a menos que se requiera interactividad
- **`'use client'`** solo cuando es necesario: hooks (useState, useEffect, useRouter), event handlers, estado local
- Los server components pueden importar client components como hojas

### Server Actions
- Archivos `actions.ts` en cada carpeta de feature con `'use server'`
- Validación con Zod schemas
- Verificación de rol admin con `getCurrentMember()` para acciones administrativas
- `revalidatePath()` después de mutaciones para refrescar caché
- Manejo de errores con `{ error: string }` o `{ success: boolean }`
- **Archivos de actions para eventos:**
  - `herramientasActions.ts`: `actualizarHerramientasActivasAction()`, `actualizarModoPantallaAction()`, `actualizarConceptoNube()`
  - `semaforoActions.ts`: `registrarVotoNegativo()`, `obtenerEstadoSemaforo()`, `resetearSemaforo()`
  - `capacitaciones/actions.ts`: `voteLivePollAction()` — server action con cookie-based dedup para encuestas de capacitaciones

### API Routes
- Para endpoints consumidos por client components (fetch desde el browser)
- GET routes para feeds públicos (`/api/press-news`, `/api/sponsors-news`)
- POST routes para procesamiento y creación
- Edge runtime cuando es posible

### Estilos
- **Tailwind CSS v4** con clases utilitarias
- Variables CSS personalizadas para tema oscuro en `globals.css`
- Tema oscuro como default y único (sin toggle)
- Animaciones con Framer Motion para elementos interactivos

### TypeScript
- Modo strict
- Tipos de base de datos completos en `src/types/database.ts` (generados de Supabase)
- Interfaces y tipos definidos localmente en cada módulo cuando es necesario

### Routing
- App Router con layouts anidados
- Dashboard usa `layout.tsx` con sidebar persistente (no se re-renderiza al navegar)
- `scroll={false}` en todos los Links del sidebar para mantener posición

### i18n
- Sistema propio basado en contexto (`LanguageContext`)
- Diccionario centralizado en `src/locales/dictionary.ts`
- Sin framework externo de i18n
- 3 idiomas: Español (default), English, Português

---

## Variables de Entorno Requeridas

| Variable | Propósito |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Key anónima de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin, server-side only) |
| `OPENROUTER_API_KEY` | API key de OpenRouter (**solo modelos FREE**) |
| `GEMINI_API_KEY` / `GEMINI_APY_KEY` | API key de Google Gemini (typo intencional) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | API key alternativa de Gemini |
| `GROQ_API_KEY` | API key de Groq (lazy-init, no crítico) |
| `HF_API_KEY` | API key de HuggingFace (embeddings fallback) |
| `OLLAMA_API_BASE_URL` | URL Ollama self-hosted (`https://ai.itecsaladillo.org.ar`) |
| `OLLAMA_MODEL` | Modelo Ollama (default: `llama3.2:latest`) |
| `RESEND_API_KEY` | API key de Resend (emails) |
| `RESEND_FROM_PRENSA` | Email remitente para prensa |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio |
| `SEMAFORO_PORT` | Puerto configuración semáforo |
| `NEXT_PUBLIC_SOCKET_URL` | URL de socket (futuro uso) |

---

## Variables de Entorno del Proyecto (package.json scripts)

| Script | Comando |
|--------|---------|
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint` |
| `sync-docs` | `node scripts/generateDocsContext.mjs` (PDFs → docsContext.ts) |
| `extract-docs` | `node scripts/extractPdfText.js` (PDFs → JSON) |
| `ingest-vector` | `node --dns-result-order=ipv4first --env-file=.env.local scripts/ingestDocsToVector.mjs` (PDFs → pgvector) |

---

## Flujo de Datos

```
Server Component  →  createClient()  →  Supabase Query  →  Render HTML
                        ↓
                  getCurrentMember()  →  auth check
                        ↓
Client Component  →  useLanguage()  →  LanguageContext
                  →  createClient()  →  Supabase Browser Client  →  Realtime subs
                  →  fetch(/api/...)  →  API Route  →  Service  →  Supabase
                        ↓
Server Action     →  getCurrentMember()  →  validate Zod  →  mutate DB  →  revalidatePath()
```

---

## Patrón para Añadir Nuevas Features

### Para rutas públicas:
1. Crear carpeta en `src/app/[ruta]/`
2. `page.tsx` (Server Component por defecto)
3. Si necesita interactividad, crear componente cliente separado

### Para rutas del dashboard:
1. Crear carpeta en `src/app/dashboard/[ruta]/`
2. `page.tsx` con `getCurrentMember()` y verificación de rol
3. Si es admin, agregar link en `adminNavItems` o en submenú colapsable de `layout.tsx`
4. Para componentes cliente, agregar API route en `src/app/api/` si necesita fetch de datos

### Para server actions:
1. Crear `actions.ts` con `'use server'`
2. Validar con Zod, verificar rol admin con `getCurrentMember()` si aplica
3. Llamar `revalidatePath()` después de mutar

### Para el sidebar:
1. Si es nav general, agregar a `navItems` en `layout.tsx`
2. Si es admin tool, agregar a `adminNavItems` o crear submenú `<details>`
3. Agregar `scroll={false}` a los links
4. Si aplica, agregar badge con conteo

### Para nuevas integraciones IA:
1. Agregar provider en `services/ai.ts` con fallback chain
2. Configurar prompt en tabla `ai_prompt_settings`
3. Agregar auditoría en `auditarRespuestaIA()`
4. Documentar en esta guía

---

## Stakeholders y sus Interfaces

| Stakeholder | Interfaz Principal | Contenido |
|-------------|-------------------|-----------|
| **Público General** | Landing, `/muro`, `/acciones`, `/articulo`, `/mapa-productivo`, `/registro-mapa`, `/certificados/[codigo]` | Noticias públicas, acciones, artículos, mapa productivo, registro, certificados digitales |
| **Miembros** | Dashboard (`/dashboard/*`) | Muro interno, reuniones, drive, ideas, perfil, certificados, aula virtual |
| **Administradores** | Dashboard + herramientas admin | Gestión de miembros, comisiones, prensa, sponsors, eventos presenciales, encuestas, nubes, streaming, videoteca, IA, capacitaciones |
| **Sponsors** | Portal sponsor (`/sponsors/[token]`) | Noticias exclusivas, reportes de impacto generados por IA |
| **Prensa/Medios** | API `/api/press-news` + email | Gacetillas, materiales de prensa, historial de envíos |
| **Asistentes a Eventos** | Portal evento (`/eventos/[id]/*`), pantalla grande (`/pantalla`) | Acreditación, preguntas, nube de palabras, encuestas |
| **Estudiantes / Alumnos** | `/capacitaciones/[id]`, `/clases/[id]`, `/registro-mapa` | Aula virtual interactiva (modómetro, chat, mano alzada), registro de talento en mapa productivo |

---

## Notas Técnicas Importantes

- **Next.js 16 breaking changes:** Revisar `node_modules/next/dist/docs/` antes de implementar nuevas features. El middleware tradicional de Next.js fue reemplazado por `proxy.ts`.
- **Tailwind v4:** Usa la sintaxis de Tailwind CSS v4, que difiere de v3 en varios aspectos (ej. `@import "tailwindcss"` en lugar de `@tailwind` directives).
- **Turbopack:** El dev server usa Turbopack (`--turbopack`), que puede tener comportamientos diferentes a webpack en desarrollo.
- **Ollama self-hosted:** El servidor Ollama corre en `https://ai.itecsaladillo.org.ar`. No asumir disponibilidad — siempre hay fallback chain.
- **Edge Runtime:** Algunas API routes usan Edge Runtime. Verificar compatibilidad de dependencias.
- **Google Service Account:** Las credenciales se almacenan en `site_settings` (no en `.env.local`) para permitir actualización sin redeploy.
- **sync-docs:** Script que extrae texto de PDFs en `training-docs` y genera `docsContext.ts`. Ejecutar después de subir nuevos documentos de entrenamiento.
- **Supabase Broadcast:** Se usa para el chat en tiempo real del aula virtual (`/clases/[id]`), independiente de `postgres_changes`.
- **localStorage como identidad:** Asistentes a eventos y alumnos en aula virtual se identifican por dispositivo via localStorage (sin login requerido).
- **Multi-nube:** Los eventos pueden tener múltiples nubes de palabras activas simultáneamente, cada una con su propia configuración.
- **Embeddings:** Se generan con Gemini `text-embedding-004` como primario y HuggingFace `all-MiniLM-L6-v2` como fallback, tanto para RAG como para el sistema de feedback del asistente.
- **Semáforo de Comprensión:** Sistema de alertas anónimas. El denominator para el cálculo de porcentaje usa `Math.max(totalAcreditados, votosNegativos, 1)` para evitar división por cero cuando no hay acreditados. Suscripciones Realtime manejan INSERT y DELETE de `eventos_asistentes`.
- **Concepto de Nube Dinámico:** Campo `nube_concepto` en tabla `eventos`. Se actualiza vía Server Action `actualizarConceptoNube()` (requiere rol admin/coordinador). Se propaga en tiempo real a celulares y pantalla gigante via suscripción Realtime a tabla `eventos`.
- **Migración 055_nube_concepto.sql:** Agrega columna `nube_concepto TEXT DEFAULT ''` a tabla `eventos`. Debe ejecutarse en Supabase después del deploy.
- **Migración 056_fix_rls_critical.sql:** Corrige políticas RLS en `clases_virtuales`, `clase_interacciones`, `certificados_digitales`, `saved_conversations`. Debe ejecutarse en Supabase.
- **Migración 031 (actualizada):** RPC `obtener_miembros_publicos` ya no retorna `email` ni `phone` para proteger PII.
- **ChatWidget lazy-loaded:** Se carga con `next/dynamic({ ssr: false })` para no impactar carga inicial de páginas.
- **Dead code cleanup:** Eliminados archivos huérfanos (`test-grok`, `test-gemini`, `news-multicanal.ts`, `aiConfig.json`), 22+ funciones nunca importadas, dependencia `dotenv` innecesaria, assets públicos default de Next.js.
- **Security hardening (jul 2026):** RPC `obtener_miembros_publicos` ya no retorna `email` ni `phone` (PII leak). LivePoll usa server action con cookie dedup en vez de update client-side directo. Errores de providers IA sanitizados (no exponen detalles internos). `createSponsorAction` tipado explícito en vez de `Record<string, unknown>`.
- **Migración 066_sponsors_publicos_rpc.sql:** Crea el RPC `obtener_sponsors_publicos()` (`security definer`, `grant` a anon/authenticated/service_role) que expone solo campos seguros de sponsors activos (`id`, `name`, `tier`, `logo_color_url`, `resena`, `website_url`, `email`) — NO expone `private_token` ni `contacto_telefono`. Ordenado por `created_at`. Consumido por `NuestrosSociosSection.tsx` en la landing.
- **Nuestros Socios (ago 2026):** Nueva sección de landing entre "Nuestra Identidad" y "Nuestro Equipo" (`AboutSection.tsx`). Grillas dinámicas por tier con columnas 2-10 y alturas estandarizadas (platino 100% con ring glow, oro 80%, plata 55%, bronce 35%, standard 10%). El título de la sección va en columna izquierda (estilo Impact con gradient) y los niveles superiores (platino/oro) en columna derecha; los inferiores a ancho completo debajo. Detalle de cada sponsor en `SponsorModal.tsx` (Framer Motion, cierre con Escape).
- **Nuestro Equipo (ago 2026):** Sección restyleada en `AboutSection.tsx` con layout espejo de Nuestros Socios (título columna izquierda + fichas rodeándolo). Primeros 9 miembros en grid 3 columnas; desde la cuarta fila, fichas horizontales a ancho completo (`lg:grid-cols-4/5`). Fichas con avatar circular, badge de rol y frase/bio, que abren el modal de perfil del miembro.
- **SponsorRegistrationForm modal (ago 2026):** El formulario de alta de sponsors se renderiza como modal controlado (`onClose`/`onCreated` props) en lugar del overlay manual, y el schema de `createSponsorAction` tipa campos opcionales como `string | null`.
- **RAG cascade integrado (ago 2026):** `/api/asistente` ahora llama a `recuperarContextoRAG()` para inyectar contexto semántico de 5 niveles (pgvector, docs locales, bucket, conversaciones, web). El asistente tiene acceso a RAG + DB en paralelo.
- **Cache P3 training-docs (ago 2026):** `ragCascade.ts` cachea el texto combinado del bucket `training-docs` en memoria (TTL 5 min, `P3_CACHE_TTL_MS`) con deduplicación de descargas concurrentes (`p3FetchPromise` compartida + `.finally()` para limpiar). El bucket se lista/descarga 1 vez por ventana de tiempo en vez de en cada request del asistente. Nivel P3 renombrado de P2 en los logs de warning.
- **Modelos gratuitos (ago 2026):** Regla de oro — todos los endpoints del asistente usan `openrouter/free` (router automático de 14+ modelos free). Eliminados todos los `deepseek/deepseek-chat` del codebase.
- **Lazy Groq init (ago 2026):** Cliente Groq en `/api/chat` usa `getGroq()` con lazy initialization para evitar error de build cuando falta `GROQ_API_KEY`.
- **pgvector RAG (migraciones 062-063):** Tabla `documents` con `vector(768)` para búsqueda semántica. RPC `match_documents` para cosine similarity. Ingesta vía `npm run ingest-vector` (PDFs → chunking 900 chars → Gemini embeddings → Supabase).
- **Constantes de IA (sept 2026):** `FALLBACK_PROMPT` define el system prompt por defecto del asistente. `ANTI_HALLUCINATION_RULES_FLEXIBLE` controla el comportamiento RAG cuando no hay contexto recuperado.
- **Conversaciones Guardadas (sept 2026):** Auto-guardado cada 10 mensajes después del umbral inicial. Detección de comandos explícitos en español. Recuperación semántica P4 con threshold 0.35.
- **SponsorHeaderBar (ago 2026):** Marquesina fija de sponsors en la landing. Logos monocromo en `public/sponsors/blanco/` (carga local vía fs en el server component — sin fetch a DB ni storage). Animación `marquee-left` en `globals.css` con duración inline (70s), pausa en hover, fade out al scroll > 10px. Logos de fallback (placehold.co) si la carpeta está vacía. `page.tsx` usa `force-dynamic` + `revalidate = 0` + `suppressHydrationWarning` para evitar el error de hidratación #418 (los `?v=mtimeMs` son determinísticos, no usan `Date.now()`).
- **Optimización sponsors + marquesina (ago 2026):** `page.tsx` cachea la lectura del filesystem con `unstable_cache` de `next/cache` (`getSponsorLogos`, key `['sponsor-logos-landing']`, `revalidate: 3600`) — evita 27+ `readdirSync`/`statSync` por request y reduce el TTFB en serverless. `SponsorHeaderBar` reduce la duplicación del loop de 4x a 2x copias (`MARQUEE_COPIES = 2`, mínimo necesario para el loop seamless de `translateX(-50%)`; la duración se ajustó a 70s para preservar la velocidad visual) y memoiza el array duplicado con `useMemo` (no se recrea en cada re-render por scroll). Imágenes con `loading="lazy"`, `decoding="async"`, `draggable={false}` y `will-change-transform` en el contenedor animado.
- **Streaming en vivo (ago 2026):** Migración `064_streaming_config.sql` + endpoint `/api/streaming/status` (público, cache 30s, `force-dynamic`). Keys de `site_settings`: `streaming_active` (`'true'`/`'false'`) y `streaming_youtube_url`. `StreamingPlayer.tsx` convierte URLs de YouTube (watch, youtu.be, embed, live) a formato embed con autoplay+mute. Se muestra en el Hero en reemplazo de las palabras spotlight.
- **Elementos flotantes (ago 2026):** Chat widget (`ChatWidget.css`) y selector de idioma anclados a `bottom: 59px` (misma altura, lado a lado en desktop), ambos con fade out al scroll. El contenido de la landing usa `-translate-y-[30px]` (wrapper) y `pb-16` en `<main>` para no solaparse con la barra de sponsors.
- **Estilos globales (ago 2026):** En `globals.css`, keyframes `marquee-left` + clase `.animate-marquee-infinite` para la marquesina de sponsors (63s default, sobreescrito inline según cantidad de copias). La clase `itec-lang-btn` estiliza el FAB del selector de idioma.
