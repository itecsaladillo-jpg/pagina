---
name: itec-verify-education-certificates
description: "Checklist de verificación de certificados, capacitaciones y Mapa Productivo en ITEC"
---

# Verificación de Educación, Certificados y Mapa Productivo

## Certificados Digitales
- [ ] `certificados_digitales`: `codigo(UNIQUE)`, `titulo`, `alumno_nombre`, `fecha`, `competencias(text[])`, `horas_catedra`, `thumbnail_url`
- [ ] RLS: SELECT público (verificación), escritura solo admin/coordinador (mig. 056)
- [ ] Validación pública por código único QR en `/certificados/[codigo]`
- [ ] `generateMetadata` condicional (noindex si inválido)

## Capacitaciones
- [ ] `trainings`: `youtube_url`, `is_live`, status
- [ ] Detalle mobile-first: player YouTube embebido, badge LIVE si `is_live`
- [ ] `LivePoll.tsx` → encuestas en vivo
- [ ] `/capacitaciones/[id]`

## Mapa Productivo
- [ ] `mapa_empresas` (+ `mapa_empresas_telefono`): Empresas registradas con descripción de oferta y demanda tecnológica
- [ ] `alumnos_talentos`: Talento estudiantil
- [ ] `/mapa-productivo` (landing informativa)
- [ ] `/registro-mapa` (formulario dual: empresa o alumno)

## Videoteca
- [ ] `videos`: `display_order`, `ai_summary`, thumbnail recalculado
- [ ] Resúmenes ejecutivos generados por IA (`generateVideoSummaryAction`)
- [ ] `/dashboard/videoteca`

## Acciones de Impacto
- [ ] `itec_actions`: `title`, `description`, `type`, `status`, `target_audience`, `capacity`, `cost`, fechas, `location`, `thumbnail_url`, `tags(text[])`, `responsible_id`, `commission_id`, `materials_urls(text[])`, `media_urls(text[])`
- [ ] `archivo_acciones` (mig. 078): Archivo de acciones y eventos históricos (2022 a 2025)
- [ ] RLS: SELECT público, INSERT/UPDATE/DELETE solo admin/coordinador
- [ ] `/dashboard/archivo`