---
name: itec-verify-ai-assistant
description: "Checklist de verificación del Asistente IA ITEC"
---

# Verificación del Asistente IA

## Checklist de Endpoints

### POST /api/asistente
- [ ] Payload válido: `mensaje` (obligatorio), `historial` (opcional), `sessionId` (UUID v4 o fallback)
- [ ] `maxDuration = 60` (Vercel Serverless)
- [ ] DEADLINE_MS = 48.000 ms
- [ ] Respuesta JSON: ` respuesta`, `modelo`, `fallback` (opcional), `guardado` (opcional)
- [ ] Presupuesto de prompt: MAX_PROMPT_CHARS = 18.000
- [ ] Jerarquía de preservación: RAG + DB NUNCA se truncan; POLÍTICA_RESPUESTA_INTEGRAL siempre al final; solo se truncua el Prompt Maestro estático si excede

### Cadena de Proveedores (orden y timeouts)
- [ ] OpenCode `mimo-v2.5-free` → 13s, header `x-session-id` obligatorio
- [ ] Groq `openai/gpt-oss-20b` → 13s, multi-key soportado
- [ ] OpenRouter `nvidia/nemotron-3-super-120b-a12b:free` → 13s, headers `HTTP-Referer` + `X-Title`
- [ ] Google Gemini `gemini-3.8-flash` → `gemini-3.6-flash` → `gemini-flash-latest` → 18s, rotación de modelos y keys

### Clasificación de Errores
- [ ] Transitorios (429, 500, 502, 503, 504, Timeout) → retry con BACKOFF_MS = 1200ms
- [ ] Permanentes (400, 401, 403, 404, 413) → deshabilitar provider

### Cascada RAG (5 Niveles)
- [ ] P1: pgvector `documents` → threshold ≥ 0.15, 6 chunks, 3200 chars máx
- [ ] P2: `DOCS_CONTEXT` local → threshold ≥ 0.22, chunking 900/120
- [ ] P3: Bucket `training-docs` → threshold ≥ 0.22, caché TTL 5 min, deduplicación concurrente
- [ ] P4: `saved_conversations` → threshold ≥ 0.35, solo misma sesión
- [ ] Soft Fallback: mejor resultado propio aunque esté bajo threshold
- [ ] P5: DuckDuckGo Instant Answer + scraping DDG Lite (sin APIs de pago)

### Inyección de Contexto en Tiempo Real
- [ ] `ai_prompt_settings` → prompt maestro editable
- [ ] `obtener_miembros_publicos` → staff activo sin PII
- [ ] `notas_publico` → últimas 10 noticias
- [ ] `commissions` → comisiones activas
- [ ] `itec_actions` → próximas actividades (planificacion o en_curso)
- [ ] `public_articles` → últimos 15 artículos
- [ ] `obtener_socios_publicos` → sponsors por tier
- [ ] `videos` → videoteca con resúmenes IA
- [ ] `mapa_empresas` → directorio productivo

### Auditoría Post-Respuesta
- [ ] Rutas internas → redactar con "Sección institucional de ITEC"
- [ ] Peques ITEC → solo log
- [ ] Lenguaje informal → solo log
- [ ] Palabras temporales → solo log
- [ ] Violaciones → tabla `ai_auditoria_violaciones`

### Tablas de IA
- [ ] `ai_prompt_settings` → lecturas cacheadas con `unstable_cache` (600s, tag `ai-prompt-settings`)
- [ ] `documents` → pgvector, vector(768), índice HNSW cosine
- [ ] `saved_conversations` → embeddings para búsqueda semántica P4
- [ ] `asistente_feedback` → calificaciones + embeddings
- [ ] `asistente_aprendizajes` → reglas aprendidas
- [ ] `asistente_embeddings` → caché de vectores
- [ ] `chat_conocimiento` → FAQ autogestión
- [ ] `ai_auditoria_violaciones` → registro de violaciones
- [ ] `api_settings` → API keys rotatables