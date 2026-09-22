---
name: itec-education-certificates
description: "Reglas de negocio para Certificados Digitales, Capacitaciones y Mapa Productivo"
---

# Capacitaciones, Certificados Digitales y Mapa Productivo (ITEC)

Basado en las secciones 8.2, 11.4, 11.5 y 14.8-14.12 de `ITEC_CODEGUIDE.md`:

## 1. Certificados Digitales
- **Tabla:** `certificados_digitales` (migraciones 0241, 056).
- **Campos:** `codigo` (UNIQUE, alfanumérico corto), `titulo`, `alumno_nombre`, `fecha`, `competencias` (text[]), `horas_catedra`, `thumbnail_url`.
- **Ruta pública de verificación:** `/certificados/[codigo]`.
- **RLS:** SELECT público libre (cualquiera puede verificar la autenticidad con el código o QR); INSERT/UPDATE/DELETE estrictamente restringido a administradores (migración 056).
- **Visor interactivo:** `CertificadoViewer` con opción de descarga y renderizado SVG/Canvas.

## 2. Capacitaciones y Entrenamientos
- **Tabla:** `trainings` y `entrenamiento_acciones`.
- **Rutas:** `/capacitaciones/[id]` para visualización de capacitaciones con YouTube embebido.
- **Interacción en vivo:** Encuestas en tiempo real integradas (`LivePoll`) con deduplicación por cookie httpOnly de 24h (`livepoll_voted_{pollId}`).

## 3. Mapa Productivo
- **Tablas:** `mapa_empresas`, `mapa_empresas_telefono`, `alumnos_talentos`.
- **Rutas:** `/mapa-productivo` y `/registro-mapa`.
- Vinculación entre el sector productivo de Saladillo y los talentos egresados de las capacitaciones y comisiones del ITEC.
