# ITEC Saladillo — Guía Técnica Integral para IA

## Descripción General
Plataforma web full-stack de **ITEC Saladillo** (Asociación Civil de Ciencia y Tecnología "Augusto Cicaré", Saladillo, Buenos Aires, Argentina). Funciona como hub comunitario que conecta miembros, sponsors, prensa y público general mediante contenido educativo, gestión de eventos presenciales, interacción en vivo con audiencias, herramientas de comunicación impulsadas por IA y un Mapa Productivo de empresas locales y talento técnico.

---

## Stack Tecnológico
- **Framework:** Next.js 16.2.6 (App Router, Turbopack)
- **React:** 19.2.4
- **Lenguaje:** TypeScript (strict)
- **Estilos:** Tailwind CSS v4 + CSS custom properties (tema oscuro)
- **Base de datos:** Supabase PostgreSQL (51+ migraciones)
- **Auth:** Supabase Auth + Google OAuth
- **Despliegue:** Vercel
- **Path alias:** `@/` → `./src/`

## Dependencias Clave
- `@supabase/supabase-js` 2.105.4, `@supabase/ssr` 0.10.3
- `groq-sdk` 1.3.0, `googleapis` 171.4.0 (Google Drive API), `@google/generative-ai`
- `framer-motion` 12.38.0, `lucide-react` 1.14.0, `recharts` 3.8.1
- `react-hook-form` 7.81.0, `zod`, `@hookform/resolvers`
- `resend` 6.12.3 (emails), `date-fns` 4.1.0
- `pdf-parse`, `dotenv`, `react-qr-code`

## Estructura del Proyecto
```
D:\ITEC\
├── .agents/                    # Configuración de agentes IA
├── .env.local                  # Variables de entorno (API keys)
├── .github/                    # GitHub workflows
├── docs/                       # Documentación interna
├── public/                     # Assets estáticos (imágenes, logos)
│   └── cicare/                 # Colección de fotos de Augusto Cicaré
├── scripts/                    # Scripts utilitarios (extracción PDF, generación docs)
├── src/
│   ├── app/                    # App Router (rutas públicas + dashboard + API)
│   │   ├── page.tsx            # Landing page
│   │   ├── layout.tsx          # Root layout (Navbar + Footer + Chat Widget)
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
│   │       ├── ideas/          # Envío de ideas (formulario público)
│   │       ├── test-grok/      # Endpoint test Groq
│   │       └── test-gemini/    # Endpoint test Gemini/Ollama
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
│   │   │   ├── Footer.tsx       # Footer del sitio
│   │   │   └── FloatingLanguageSelector.tsx # Selector flotante ES/EN/PT
│   │   ├── comunicacion/        # Comunicación multicanal
│   │   │   ├── NewsWallMulticanal.tsx       # Muro con tabs: Público/Miembros/Sponsors/Prensa
│   │   │   ├── NewsFlashMulticanalEditor.tsx # Editor multicanal con IA
│   │   │   ├── ComunicacionTabs.tsx         # Tabs de comunicación
│   │   │   ├── NotasMulticanalList.tsx      # Lista de notas publicadas
│   │   │   └── ActionManagementList.tsx     # Lista de acciones
│   │   ├── chat/                # Widget flotante del asistente IA
│   │   │   └── ChatWidget.tsx   # Widget visible en todas las páginas públicas
│   │   ├── capacitaciones/      # Encuestas en vivo
│   │   │   └── LivePoll.tsx     # Votación en tiempo real
│   │   ├── acciones/            # Registro a acciones
│   │   │   └── ActionRegistrationForm.tsx
│   │   ├── reuniones/           # Salas de reuniones
│   │   │   └── GeneralMeetingRoom.tsx
│   │   ├── auth/                # Autenticación
│   │   │   ├── LoginClientContent.tsx  # Login Google OAuth
│   │   │   └── MembersAccessButton.tsx # Botón de acceso en navbar
│   │   ├── dashboard/           # Sidebar del dashboard
│   │   │   └── SidebarIdeasLink.tsx    # Link con badge de ideas pendientes
│   │   ├── ideas/               # Formulario público de ideas
│   │   │   └── PublicIdeasForm.tsx
│   │   └── prensa/              # Gestión de prensa
│   │       ├── SendGacetillaModal.tsx   # Modal envío gacetillas por email
│   │       └── PrensaEnviosHistoryModal.tsx # Historial de envíos
│   ├── services/
│   │   ├── auth.ts             # getCurrentMember(), signInWithGoogle(), isAdmin()
│   │   ├── ai.ts               # Procesamiento con IA (OpenRouter), embeddings (Gemini), auditoría
│   │   ├── admin.ts            # CRUD de miembros, comisiones, prompts IA
│   │   ├── news.ts             # News multicanal (getAllMulticanalNewsFlashes, etc.)
│   │   ├── news-multicanal.ts  # Tipos: NewsFlashMulticanal, NewsComment
│   │   ├── drive.ts            # Google Drive: listFolderFiles(), getRecentFiles()
│   │   ├── videos.ts           # CRUD de videos
│   │   ├── actions.ts          # Acciones públicas
│   │   ├── sponsorReport.ts    # Generación de reportes de impacto con IA
│   ├── lib/
│   │   ├── supabase/           # Clientes Supabase (server, browser, admin)
│   │   ├── rag/                # RAG cascade (P1-P4), conversaciones guardadas
│   │   ├── drive.ts            # Configuración de carpetas Drive por comisión
│   │   ├── email.ts            # Servicio de emails con Resend
│   │   ├── email/              # Templates HTML de emails
│   │   ├── docsContext.ts      # Contexto institucional auto-generado para asistente IA
│   │   └── docsContext.json    # Fallback estático de contexto
│   ├── types/
│   │   └── database.ts         # Tipos completos de la DB
│   ├── locales/
│   │   └── dictionary.ts       # Traducciones ES/EN/PT (context-based i18n)
│   ├── config/
│   │   └── aiConfig.json       # Config del modelo IA
│   ├── contexts/
│   │   └── LanguageContext.tsx  # Contexto de idioma
│   └── proxy.ts                # Next.js middleware (auth, protección de rutas)
├── supabase/
│   └── migrations/             # 48 migraciones de base de datos
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
| `eventos` | Eventos presenciales (slug QR, titulo, fecha, ubicacion, portada) |
| `eventos_asistentes` | Asistentes a eventos presenciales |
| `evento_preguntas` | Preguntas para oradores (con sistema de likes) |
| `evento_preguntas_colaborador` | Colaboración en preguntas |
| `evento_preguntas_likes` | Likes en preguntas de eventos |

### Sponsors
| Tabla | Descripción |
|-------|-------------|
| `sponsors` | Organizaciones sponsor con `tier`(platino\|oro\|plata\|bronce), `private_token(uuid UNIQUE)`, `nombre_empresa`, `actividad`, `zona_influencia`, `nombre_contacto`, `apellido_contacto`, `telefono` |
| `sponsor_reports` | Reportes de impacto generados por IA para sponsors |
| `sponsors_medios` | Medios/sponsors para distribución de prensa |

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
| `ai_auditoria_violaciones` | Registro de violaciones en respuestas IA (palabras prohibidas, exposición de rutas, etc.) |
| `asistente_feedback` | Feedback de usuarios sobre respuestas del asistente (con embeddings) |
| `asistente_aprendizajes` | Patrones aprendidos de interacciones |
| `asistente_embeddings` | Embeddings vectoriales para RAG |
| `saved_conversations` | Conversaciones guardadas (con embeddings para búsqueda semántica) |
| `chat_conocimiento` | Base de conocimiento de interacciones |
| `training_docs` | Documentos de entrenamiento del asistente (en Storage bucket) |

### Aula Virtual
| Tabla | Descripción |
|-------|-------------|
| `clases_virtuales` | Sesiones de clases virtuales con estado de streaming |
| `clase_interacciones` | Interacciones en vivo (chat, mano alzada, modómetro) vía Supabase Broadcast |

### Certificados
| Tabla | Descripción |
|-------|-------------|
| `certificados_digitales` | Certificados digitales verificables por QR con `codigo(UNIQUE)`, `titulo`, `alumno_nombre`, `fecha`, `competencias(text[])`, `horas_catedra`, `thumbnail_url` |

### Entrenamiento
| Tabla | Descripción |
|-------|-------------|
| `trainings` | Sesiones de entrenamiento/capacitación |
| `entrenamiento_acciones` | Acciones vinculadas a entrenamientos |

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
2. **`/api/news/process`** — Llama a `generateMulticanalNews()` en `services/ai.ts` que usa OpenRouter (DeepSeek Chat) para generar 4 textos diferentes para 4 canales (público, miembros, sponsors, medios) usando un prompt de agente de prensa.
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
  - **Herramientas para Eventos** (púrpura): Encuestas, Sistema Preguntas, Nube Ideas, Crear Evento, Editar Evento. Cada herramienta se activa/desactiva individualmente por evento via `herramientas_activas` (JSONB, claves: `encuestas`, `preguntas`, `nube`).
- Usa `scroll={false}` en todos los links para mantener posición al navegar.
- Diseño responsive con color-coding por sección.
- Los badges muestran conteos de items pendientes (ej. comentarios no leídos).

---

## Sistema de IA — Proveedores y Servicios

### Proveedores de IA
| Proveedor | Modelo | Uso |
|-----------|--------|-----|
| **OpenRouter** | DeepSeek Chat / DeepSeek R1 | Provider principal del asistente (`/api/asistente`) y procesamiento de noticias |
| **Ollama** (self-hosted) | llama3.2:latest | Generación de reportes de sponsors, consolidación de feedback |
| **Google Gemini** | gemini-2.0-flash / text-embedding-004 | Fallback para servicios IA, embeddings vectoriales primarios |
| **Groq** | LLaMA 3.3 70B / LLaMA 3.1 8B | Chat legacy (`/api/chat`), endpoints de test |
| **HuggingFace** | Llama 3.1 8B / all-MiniLM-L6-v2 | Fallback del asistente + embeddings secundarios |

### Servicios de IA (`src/services/ai.ts`)
| Función | Propósito |
|---------|-----------|
| `processWithAI()` | Genera resúmenes + action items de transcripciones de reuniones |
| `generateFlash()` | Crea flashes noticiosos cortos para el muro interno |
| `generateExecutiveSummary()` | Resúmenes ejecutivos a partir de notas |
| `generateActionItems()` | Extrae items de acción de textos |
| `generatePublicArticle()` | Transforma datos crudos en artículos publicables usando IA |
| `generateActionSuccessStory()` | Crea historias de éxito de acciones completadas |
| `transcribirAudio()` | Transcripción de audio a texto |
| `generateMinutesFromSummary()` | Genera actas formales a partir de resúmenes |
| `generateMulticanalNews()` | Genera contenido para 4 audiencias (público, miembros, sponsors, medios) |
| `generateVideoSummary()` | Resume videos de YouTube |
| `generarEmbedding()` | Genera embeddings vía Gemini o HuggingFace |
| `buscarFeedbacksSimilares()` | Búsqueda semántica de feedbacks similares |
| `auditarRespuestaIA()` | Audita respuestas por violaciones de policy (4 categorías) |

### RAG Cascade (`src/lib/rag/ragCascade.ts`)
Sistema de recuperación de 4 niveles con scoring por solapamiento de tokens (estilo Jaccard):
1. **P1** (score >= 0.45) — Documentos locales pre-parseados (`DOCS_CONTEXT` generado por `npm run sync-docs`)
2. **P2** (score >= 0.40) — Supabase Storage bucket `training-docs`
3. **P3** — Conversaciones guardadas (búsqueda semántica por embeddings vectoriales)
4. **P4** — Web search (DuckDuckGo como fallback externo)
- **Soft fallback:** Retorna el mejor resultado incluso si no alcanza thresholds
- Compatible con Edge Runtime (sin dependencias Node pesadas)

### Asistente IA (`/api/asistente`)
- Edge runtime
- Obtiene contexto dinámico (comisiones, staff, actividades recientes, news, feedbacks)
- Inyecta contexto RAG del cascade
- Detecta comandos explícitos de guardado y auto-guarda conversaciones largas (umbral de mensajes)
- System prompt: enforce estilo ITEC (técnico, humano, vanguardista)
- Palabras prohibidas: "hoy", "ayer", "mañana", "che", "viste", "pibe"
- **Auditoría de IA** (`auditarRespuestaIA()`) — 4 categorías de detección vía regex:
  1. Menciones prohibidas (palabras bloqueadas)
  2. Exposición de rutas internas del sistema
  3. Lenguaje informal o fuera de tono
  4. Uso de palabras temporales relativas
  Las violaciones se registran en `ai_auditoria_violaciones`
- **Sistema de Feedback** (`/api/asistente/feedback`):
  - Usuarios califican respuestas (rating + comentario)
  - Se guardan en `asistente_feedback` con embeddings generados
  - Búsqueda semántica de feedbacks similares via `buscarFeedbacksSimilares()` (Gemini + HuggingFace)
- Fallback: OpenRouter → HuggingFace

---

## Páginas Públicas — Detalle Funcional

### Landing Page (`/`)
Secciones: Hero (logo + fotos Cicaré), Navbar con navegación completa, Métricas de Impacto (contadores animados), Videoteca (videos de YouTube con resúmenes IA), Sección "Acerca de", Comisiones (grid visual con colores), Buzón de Ideas (formulario), Footer completo.

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
- **QR de acreditación** — Los asistentes se acreditan escaneando QR o completan formulario con nombre, email, teléfono, organización
- **Credencial por dispositivo** — Identificación por localStorage (sin login requerido)
- **Preguntas al orador** (`/preguntar`) — Los asistentes envían preguntas con sistema de likes, opción de anonimato
- **Pantalla de preguntas** (`/pantalla-preguntas`) — Moderador muestra preguntas aprobadas en pantalla grande
- **Nube de palabras** (`/nube`, `/pantalla-nube`) — Audiencia envía palabras a nubes colaborativas; soporta múltiples nubes activas por evento con límite de caracteres, normalización de diacríticos y desduplicación
- **Encuestas** — Votación en tiempo real con resultados visibles, un voto por dispositivo
- **Big Screen Display** (`/pantalla`) — Pantalla completa para proyector con múltiples modos:
  - **Modo Bienvenida** — Código QR + conteo de asistentes
  - **Modo Encuestas** — Barras animadas con resultados en vivo
  - **Modo Nube de Palabras** — Visualización de palabras con tamaño proporcional a frecuencia
  - **Modo Q&A** — Preguntas destacadas con más votos
  - Fondos animados con Framer Motion
- **Confirmación por email** — Email de bienvenida al registrarse via Resend

### Portal del Sponsor (`/sponsors/[id]`)
Acceso por token privado (`private_token`). Muestra contenido exclusivo para el sponsor, reportes de impacto generados por IA.

### Chat Widget Asistente IA
Widget flotante visible en todas las páginas públicas. Usa el endpoint `/api/asistente` con RAG cascade completo. Interfaz tipo chat con historial.

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
Gestión de transmisiones en vivo. Control de estado de aulas virtuales.

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
Creación de eventos con slug QR, fecha, ubicación, panel de oradores. Edición de eventos existentes via `/[id]`. Incluye: preacreditación, configuración de modos de pantalla (bienvenida, encuestas, nube, Q&A), gestión de herramientas activas por evento (encuestas, preguntas, nube). El **Panel del Orador** (`PanelOradorClient`) gestiona switches individuales de herramientas y modo de proyección.

### Nubes de Palabras (`/dashboard/nubes`)
Gestión de nubes de palabras generadas durante eventos. Visualización y exportación.

### Gestión de Prensa (`/dashboard/prensa`)
CRUD de medios de prensa registrados. Envío de gacetillas por email via Resend. Historial de envíos en `prensa_envios_log`.

### Gacetillas de Prensa (`/dashboard/prensaNews`)
Creación y gestión de gacetillas. Distribución segmentada a medios registrados.

### Gestión de Sponsors (`/dashboard/sponsors`)
CRUD de sponsors con niveles (platino, oro, plata, bronce). Generación de reportes de impacto con IA (Ollama). Tokens privados únicos.

### Muro Sponsors (`/dashboard/sponsorsNews`)
Gestión de contenido exclusivo para sponsors. Noticias visibles en portal del sponsor.

### Creación de Acciones de Impacto (`/dashboard/acciones/nueva`)
Formulario para crear nuevas acciones de impacto (capacitaciones, eventos sociales, divulgaciones) con campos: título, descripción, tipo, audiencia, capacidad, costo, fechas, ubicación, tags, responsable, comisión.

---

## API Routes — Detalle

| Ruta | Método | Propósito | Input/Output |
|------|--------|-----------|--------------|
| `/api/ideas` | POST | Enviar idea al buzón | `{ nombre, email, mensaje }` |
| `/api/chat` | POST | Chat IA via Groq con contexto dinámico + web search | `{ message, history[] }` → `{ response }` |
| `/api/chat/guardar` | POST | Guardar conversación en base de conocimiento | `{ conversation[] }` |
| `/api/asistente` | POST | Chat IA principal con RAG cascade | `{ message, history[] }` → `{ response, sources[] }` |
| `/api/asistente/feedback` | POST | Enviar feedback sobre respuesta del asistente | `{ message, response, rating, feedback }` |
| `/api/news/process` | POST | Procesar texto crudo con IA para generar 4 versiones | `{ titulo, texto, commission_id, canales[] }` |
| `/api/news-comments` | GET | Listar comentarios de noticia | `?newsFlashId=` |
| `/api/news-comments` | POST | Agregar comentario | `{ news_flash_id, content, author_name }` |
| `/api/sponsors-news` | GET | Obtener notas publicadas para sponsors | → `notas_sponsors[]` |
| `/api/press-news` | GET | Obtener gacetillas para prensa | → `notas_medios[]` |
| `/api/eventos/registro` | POST | Registrar asistente a evento + email bienvenida | `{ evento_id, nombre, email }` |
| `/api/test-grok` | POST | Test endpoint para Groq | `{ prompt }` → `{ response }` |
| `/api/test-gemini` | POST | Test endpoint para Gemini/Ollama | `{ prompt }` → `{ response }` |

---

## Integraciones Externas

### Supabase
- **Database:** PostgreSQL con 51+ migraciones, RLS policies
- **Auth:** Supabase Auth con Google OAuth, manejo de sesiones via cookies SSR
- **Storage:** 3 buckets: `article-media` (imágenes artículos), `avatars` (fotos perfil), `training-docs` (PDFs entrenamiento IA)
- **Realtime:** Suscripciones `postgres_changes` para estado de clases virtuales en vivo; **Supabase Broadcast** para chat en tiempo real en aula virtual; Realtime para votos de encuestas, preguntas y nubes de palabras en eventos

### Google Drive API
- Autenticación via Service Account (credenciales en `site_settings`)
- Carpetas organizadas por comisión (`drive_folder_id` en tabla `commissions`)
- Funciones: `listFolderFiles()`, `getRecentFiles()`
- Archivos visibles en el dashboard (`/dashboard/drive`)

### Google Gemini
- API para embeddings (`text-embedding-004`) — primario para RAG
- API para generación de texto (`gemini-2.0-flash`) — fallback del asistente
- Múltiples API keys configuradas como fallback chain

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
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin) |
| `GROQ_API_KEY` | API key de Groq |
| `RESEND_API_KEY` | API key de Resend |
| `RESEND_FROM_PRENSA` | Email remitente para prensa |
| `OPENROUTER_API_KEY` | API key de OpenRouter |
| `GEMINI_APY_KEY` | API key de Google Gemini (nota: typo intencional en el nombre real) |
| `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`, `GEMINI_API_KEY_4` | API keys adicionales de Gemini (fallback chain) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | API key alternativa de Gemini |
| `OLLAMA_API_BASE_URL` | URL del servidor Ollama self-hosted |
| `OLLAMA_MODEL` | Nombre del modelo Ollama |
| `HF_API_KEY` | API key de HuggingFace |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio |
| `NEXT_PUBLIC_MEET_LINK` | Link default de Google Meet para reuniones y streaming |
| `OPENAI_API_KEY` | API key de OpenAI (usada en endpoint test-grok) |

---

## Variables de Entorno del Proyecto (package.json scripts)

| Script | Comando |
|--------|---------|
| `dev` | `next dev --turbopack` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `next lint` |
| `sync-docs` | `npx tsx scripts/generate-docs-context.ts` (sincroniza documentos de entrenamiento al contexto del asistente) |

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
