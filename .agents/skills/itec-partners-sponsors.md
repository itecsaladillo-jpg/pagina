---
name: itec-partners-sponsors
description: "Reglas para Sponsors, Alianzas Estratégicas, Medios y Saladillo for Export"
---

# Sponsors, Socios y Saladillo for Export (ITEC)

Basado en las secciones 8.2, 11.2, 13.1, 14.15 y 14.20 de `ITEC_CODEGUIDE.md`:

## 1. Sponsors y Tiers
- **Tabla:** `sponsors` (migraciones 002, 065, 068, 0701).
- **Tiers reconocidos:** `platino`, `oro`, `plata`, `bronce`, `standard`.
- **Clasificación (`type`):**
  - `SPONSOR`: Empresas auspiciantes con aporte económico.
  - `STRATEGIC_ALLIANCE`: Universidades, cámaras empresariales y organismos.
  - `DIFFUSION_CHANNEL`: Medios de comunicación y radios aliadas.
- **Logos:** `logo_color_url` y `logo_monocromo_url`. Bucket `sponsors-logos`.
- **Alturas UI diferenciadas:** Platino (h-24), Oro (h-20), Plata (h-16), Bronce (h-12).

## 2. Portal Privado de Sponsors
- **Acceso:** `/sponsors/[id]` mediante UUID secreto `private_token`.
- La página tiene directiva `noindex` para evitar indexación en buscadores.
- **Reportes de Impacto:** `sponsor_reportes` y `sponsor_reportes_acciones`, generados con IA resumiendo el alcance obtenido en eventos y acciones.

## 3. Alianzas Estratégicas y Medios de Difusión
- **Tabla:** `strategic_partners` (migración 067).
- **Campos obligatorios:** `category`, `actions_description`, `logo_url`, `is_active`.
- **Medios de Prensa:** `medios_prensa` con columna `logo_url` (migración 074) para marquesinas y gacetillas.
- **RPCs públicas:** `obtener_sponsors_publicos()` y `obtener_socios_publicos()`.

## 4. Saladillo for Export
- **Tabla:** `saladillo_for_export` (migración 071).
- **Campos:** `nombre`, `foto_url`, `ciudad_residencia`, `pais_residencia`, `escuela_origen`, `profesion_rol`, `mensaje_gratitud`, `es_embajador`, `orden_embajador`, `estado`.
- **Estados:** `pendiente`, `aprobado`, `rechazado`.
- **RLS:** SELECT público solo para `estado = 'aprobado'`; INSERT público para el formulario de testimonios; UPDATE/DELETE solo admins.
- **Storage:** Bucket `saladillo-export-photos` público para subida y visualización.
- **Embajadores:** Máximo 4 embajadores destacados en la home (`orden_embajador` 1 a 4).
