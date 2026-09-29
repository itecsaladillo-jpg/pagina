---
name: itec-verify-db-connection
description: "Checklist de verificación de conexión a Supabase y tablas por funcionalidad en ITEC"
---

# Verificación de Conexión a BD (Supabase)

## Checklist de Conexiones

### 1. Clientes Supabase
- [ ] `src/lib/supabase/server.ts`: `createServerClient` de `@supabase/ssr` + `cookies()` de `next/headers`. Siempre `await createClient()`.
- [ ] `src/lib/supabase/client.ts`: `createBrowserClient` con env vars públicas.
- [ ] Cliente crudo `@supabase/supabase-js` en `/api/asistente` y `/api/chat` con `SUPABASE_SERVICE_ROLE_KEY`.

### 2. Verificar que cada cliente funciona
```bash
# Verificar variables de entorno
node -e "require('dotenv').config(); console.log({
  url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  service: !!process.env.SUPABASE_SERVICE_ROLE_KEY
})"
```

### 3. Tablas por Funcionalidad (verificar que existen y devuelven datos)

| Funcionalidad | Tablas a verificar |
|---------------|-------------------|
| Auth / Miembros | `members`, `commissions`, `commission_members`, `allowed_emails` |
| Comunicación Multicanal | `news_flashes`, `notas_publico`, `notas_miembros`, `notas_sponsors`, `notas_medios` |
| Acciones de impacto | `itec_actions`, `archivo_acciones` |
| Eventos Presenciales | `eventos`, `eventos_asistentes`, `eventos_encuestas`, `eventos_preguntas`, `evento_nubes`, `evento_semaforo_votos` |
| Aula Virtual | `clases_virtuales`, `clase_modometro_votos`, `clase_mano_alzada`, `clase_preguntas`, `clase_encuestas`, `clase_semaforo_votos`, `clase_interacciones` |
| Encuestas Globales | `polls`, `poll_questions`, `poll_options`, `poll_votes` |
| Certificados y Capacitaciones | `certificados_digitales`, `trainings` |
| Sponsors y Socios | `sponsors`, `strategic_partners`, `medios_prensa`, `sponsor_reportes` |
| IA y Asistente | `ai_prompt_settings`, `documents`, `saved_conversations`, `asistente_feedback`, `asistente_aprendizajes`, `asistente_embeddings`, `chat_conocimiento`, `ai_auditoria_violaciones`, `api_settings` |
| Otros módulos | `ideas`, `videos`, `meeting_notes`, `mapa_empresas`, `alumnos_talentos`, `saladillo_for_export`, `whatsapp_templates`, `whatsapp_logs`, `whatsapp_contacts`, `whatsapp_groups`, `whatsapp_group_contacts` |

### 4. RPCs Principales
- [ ] `obtener_miembros_publicos` → sin email/teléfono (PII protegida)
- [ ] `obtener_socios_publicos` → unify sponsors + strategic_partners + medios_prensa
- [ ] `match_documents(query_embedding, match_threshold, match_count)` → pgvector cosine
- [ ] `handle_new_user()` → trigger de alta automática
- [ ] `reiniciar_semaforo_clase(uuid)`, `toggle_pregunta_voto(uuid, uuid, text)`

### 5. Políticas RLS Críticas
- [ ] `certificados_digitales`: SELECT público, escritura solo admin/coordinador (mig. 056)
- [ ] `members`: RLS activo
- [ ] `clase_modometro_votos`, `evento_semaforo_votos`: RLS abierta intencionalmente (interacciones anónimas)
- [ ] `saladillo_for_export`: SELECT solo aprobados; INSERT público (mig. 071)
- [ ] `sponsors-logos` bucket: SELECT público; INSERT autenticado admin/coordinador
- [ ] `saladillo-export-photos` bucket: SELECT público; INSERT público

### 6. Scripts de Diagnóstico
- `scripts/agent-get-context.mjs` → consulta `news_flashes` y `itec_actions`
- `npm run sync-docs` → sincroniza corpus institucional
- `npm run ingest-vector` → pipeline pgvector