---
name: itec-verify-coordinator
description: "Coordinador de verificación funcional de todas las funcionalidades del ITEC"
---

# Coordinador de Verificación Funcional

## Matriz de Agentes

| Agente | Especialización | Tablas / Endpoints Clave |
|--------|----------------|--------------------------|
| `itec-verify-db-connection` | Conexiones Supabase y estructura de tablas | server.ts, client.ts, service_role |
| `itec-verify-ai-assistant` | Asistente IA, RAG cascade, proveedores | `/api/asistente`, `/api/chat`, `documents`, `ai_prompt_settings` |
| `itec-verify-auth-members` | Autenticación, roles, pre-aprobaciones | `members`, `commissions`, `allowed_emails`, OAuth |
| `itec-verify-events-realtime` | Eventos presenciales, aula virtual, realtime | `eventos_*`, `clase_*`, `semaforo_votos` |
| `itec-verify-multichannel-comm` | Comunicación multicanal, gacetillas, WhatsApp | `news_flashes`, `notas_*`, `whatsapp_*` |
| `itec-verify-education-certificates` | Certificados QR, capacitaciones, Mapa Productivo | `certificados_digitales`, `trainings`, `mapa_empresas` |
| `itec-verify-partners-sponsors` | Sponsors, socios estratégicos, Saladillo for Export | `sponsors`, `strategic_partners`, `saladillo_for_export` |
| `itec-verify-integrations-cloud` | Google Drive, YouTube, Resend, Storage | Drive API, `api_settings`, buckets |
| `itec-verify-frontend-next16` | Frontend Next.js 16, App Router, i18n | `proxy.ts`, `dictionary.ts`, page.tsx |
| `itec-verify-whatsapp-crm` | Módulo WhatsApp, plantillas, agenda, grupos | `whatsapp_templates`, `whatsapp_contacts` |

## Flujo de Verificación

### Fase 1 - Conexiones Base
```bash
# Verificar variables de entorno
node -e "require('dotenv').config(); console.log({
  url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  service: !!process.env.SUPABASE_SERVICE_ROLE_KEY
})"
```

### Fase 2 - Autenticación
- Verificar trigger `handle_new_user()`
- Verificar `allowed_emails`
- Verificar proxy `src/proxy.ts`

### Fase 3 - IA y Asistente
- Verificar endpoints del asistente
- Verificar cascada RAG (5 niveles)
- Verificar cadena de proveedores

### Fase 4 - Funcionalidades Especializadas
- Eventos presenciales + aula virtual
- Comunicación multicanal + WhatsApp
- Certificados + capacitaciones + Mapa Productivo
- Sponsors + socios estratégicos + Saladillo for Export
- Integraciones cloud (Drive, YouTube, Resend, Storage)

### Fase 5 - Frontend
- `npm run build`
- `npm run lint`
- Verificar breaking changes Next.js 16

### Fase 6 - Reporte Consolidado
- Generar reporte de verificación con hallazgos y recomendaciones

## Criterios de Éxito General

- [ ] Conexión server.ts funciona sin errores
- [ ] Conexión client.ts funciona sin errores
- [ ] Service Role key tiene privilegios correctos (bypass RLS)
- [ ] Cada tabla crítica contiene al menos un registro (o está vacía por diseño documentado)
- [ ] Políticas RLS coinciden con lo documentado en `ITEC_CODEGUIDE.md` sección 7
- [ ] Las RPCs principales son accesibles
- [ ] `npm run build` compila sin errores
- [ ] `npm run lint` pasa sin errores críticos
- [ ] Los endpoints del asistente responden dentro del deadline de 48s
- [ ] La cascada RAG sigue el orden P1 → P2 → P3 → P4 → Soft Fallback → P5