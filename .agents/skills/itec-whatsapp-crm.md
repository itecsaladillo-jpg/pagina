---
name: itec-whatsapp-crm
description: "Reglas y arquitectura del módulo de WhatsApp masivo y Agenda Unificada en ITEC"
---

# Módulo WhatsApp y Agenda Unificada (ITEC)

Basado en la sección 10.1 y 14.21 de `ITEC_CODEGUIDE.md`:

## 1. Plantillas y Mensajería
- **Tabla:** `whatsapp_templates` (migración 0121).
- **Categorías:** `general`, `evento`, `socio`, `sponsor`, `medio`.
- **Variables dinámicas soportadas:** `{{nombre}}`, `{{evento}}`, `{{fecha}}`, `{{comision}}`, `{{lugar}}`.
- Al generar el mensaje, reemplazar las variables de forma segura y tolerante a nulos.

## 2. Agenda Unificada
- Consolidación en memoria de 6 fuentes de datos distintas:
  1. `members` (miembros activos de ITEC con teléfono).
  2. `eventos_asistentes` (acreditados e inscriptos a eventos presenciales).
  3. `sponsors` (teléfonos de contacto de empresas sponsors y socios).
  4. `medios_prensa` (contactos de periodistas y directores de medios).
  5. `mapa_empresas` / `mapa_empresas_telefono` (empresas del directorio productivo).
  6. `whatsapp_contacts` (contactos externos creados manualmente o importados).
- Deduplicación por número telefónico normalizado.

## 3. Normalización Telefónica Internacional
- Formato destino estándar: E.164 sin espacios, guiones ni paréntesis.
- Reglas específicas para Argentina:
  - Eliminar prefijo local `0` en código de área.
  - Eliminar prefijo `15` en número local.
  - Asegurar código de país `+54 9` para móviles.
- Si el número no puede validarse, marcarlo con advertencia y permitir corrección manual.

## 4. Deep Links y Envíos
- Generación de URL: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`.
- Registro de auditoría obligatorio en `whatsapp_logs` (migración 0133) con estado de envío, timestamp y destinatario.

## 5. Grupos de Contactos (N:M)
- Tablas: `whatsapp_groups` y `whatsapp_group_contacts` (migración 0132).
- Soporta asignación masiva de contactos a grupos y filtrado de envíos segmentados.
