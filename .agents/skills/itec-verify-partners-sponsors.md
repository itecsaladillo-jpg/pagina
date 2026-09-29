---
name: itec-verify-partners-sponsors
description: "Checklist de verificación de sponsors, socios estratégicos y Saladillo for Export en ITEC"
---

# Verificación de Sponsors, Socios y Saladillo for Export

## Sponsors Comerciales
- [ ] Tabla `sponsors`: `tier` (platino|oro|plata|bronce|standard), `rubro`, `resena`, contactos, `logo_monocromo_url`, `logo_color_url`, `private_token` (UNIQUE), `type TEXT DEFAULT 'SPONSOR'`
- [ ] Portal privado de sponsor: `/sponsors/[id]` con acceso vía `private_token` y directiva noindex
- [ ] Gestión administrativa: `/dashboard/sponsors` (CRUD de sponsors, asignación de tiers)
- [ ] Visualización pública: `/socios` con carrusel/grilla clasificada por tiers

## Socios Estratégicos
- [ ] Tabla `strategic_partners` (mig. 067): `category` (institucion_educativa|organismo_publico|ong|empresa_aliada|otro), `actions_description`, `logo_url`, `is_active`
- [ ] RLS: SELECT público solo activos (`is_active = true`), escritura restringida a administradores
- [ ] Trigger automático: `strategic_partners_updated_at`

## Canales de Difusión y RPC de Socios
- [ ] Tabla `medios_prensa`: registros de medios y canales de difusión con `logo_url`
- [ ] RPC `obtener_socios_publicos`: UNION ALL normalizada de sponsors activos + socios estratégicos + medios de prensa

## Saladillo for Export
- [ ] Tabla `saladillo_for_export` (mig. 071): `nombre`, `foto_url`, `ciudad_residencia`, `pais_residencia`, `escuela_origen`, `profesion_rol`, `mensaje_gratitud`, `es_embajador` (bool), `orden_embajador` (1–4), `estado` (pendiente|aprobado|rechazado)
- [ ] Moderación de testimonios: `/dashboard/saladillo-for-export`
- [ ] Selección y orden de embajadores (posiciones 1 a 4 destacadas)
- [ ] RLS y Storage: SELECT público solo aprobados; INSERT público; bucket `saladillo-export-photos` público

## Reportes de Impacto para Sponsors
- [ ] Tablas `sponsor_reportes` y `sponsor_reportes_acciones`
- [ ] Generación automática mensual vía IA (`src/services/sponsorReport.ts`) con fallback local si Ollama no responde
