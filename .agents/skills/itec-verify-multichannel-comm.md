---
name: itec-verify-multichannel-comm
description: "Checklist de verificación de comunicación multicanal en ITEC"
---

# Verificación de Comunicación Multicanal

## Tablas de Noticias
- [ ] `news_flashes`: `titulo`, `commission_id`, `author_id`, `original_text`, `summary`, `flash_text`, `source_type`, `is_published`, `tags`, `texto_publico`, `texto_miembros`, `texto_sponsors`, `texto_medios`, `datos_crudos`, `para_publico`, `para_miembros`, `para_sponsors`, `para_medios`, `media_urls(jsonb)`
- [ ] `notas_publico` / `notas_miembros` / `notas_sponsors` / `notas_medios`: Una tabla por canal (contenido adaptado por IA)
- [ ] `notas_generadas`: Notas generadas por IA
- [ ] `public_articles`: Artículos con slugs, `related_video_id`, `news_flash_id`
- [ ] `news_comments`: Comentarios (soft delete), FK `news_flash_id`
- [ ] `news_media`: Multimedia adjunto

## Gacetillas de Prensa
- [ ] `prensa_envios_log`: Historial de envíos (estado, destinatario, errores)
- [ ] `medios_prensa`: Medios registrados (también usados como canales de difusión, `media_urls`). Columna `logo_url` (mig. 074)
- [ ] Envío vía Resend API
- [ ] `RESEND_API_KEY` y `RESEND_FROM_PRENSA` configurados

## Reportes de Impacto
- [ ] `sponsor_reportes` (+ `sponsor_reportes_acciones`): Reportes de impacto IA
- [ ] Generación vía Ollama self-hosted (`llama3.2:latest`) con timeout 98s
- [ ] Fallback local si falla Ollama (`buildFallbackReport()` con `generado_con_ia: false`)
- [ ] Parseo de 4 secciones separadas por `---SECCION---`

## WhatsApp
- [ ] `whatsapp_templates`: `titulo`, `body`, `categoria` (general\|evento\|socio\|sponsor\|medio)
- [ ] `whatsapp_logs`: Auditoría de envíos
- [ ] `whatsapp_contacts`: `telefono` (UNIQUE), `nombre`, `fuente` (manual\|vcf\|csv\|device), `es_agenda_itec`
- [ ] `whatsapp_groups`: `nombre`, `descriptor`
- [ ] `whatsapp_group_contacts`: Relación N:M grupo-contacto
- [ ] Normalización telefónica internacional (`+54 9 ...`)
- [ ] Agenda unificada consolidada de 6 fuentes

## API Routes de Comunicación
- [ ] `POST /api/news/process` → maxDuration 60s (4 versiones en paralelo)
- [ ] `GET /api/press-news` → notas de prensa
- [ ] `GET /api/sponsors-news` → muro exclusivo sponsors
- [ ] `GET /api/news-comments` → comentarios de noticias