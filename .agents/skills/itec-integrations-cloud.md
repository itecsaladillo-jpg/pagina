---
name: itec-integrations-cloud
description: "Reglas para servicios en la nube: Google Drive, YouTube, Resend y Supabase Storage"
---

# Integraciones Externas y Servicios Cloud (ITEC)

Basado en las secciones 8.2, 14.7, 14.16, 14.17 y 18 de `ITEC_CODEGUIDE.md`:

## 1. Google Drive API (Service Account)
- **Credenciales:** Almacenadas en la base de datos en `site_settings.google_service_account_json` (NO en `.env` para permitir rotación en caliente sin redeploy).
- **ID Raíz:** `site_settings.google_drive_root_id`.
- **Estructura:** Carpetas sincronizadas por comisión (`commissions.drive_folder_id`) y carpetas de actas de reuniones (`meeting_notes`).

## 2. YouTube Live Streaming y Videoteca
- **Streaming en vivo:**
  - Estado guardado en `site_settings` / `api_settings` (claves `streaming_is_active`, `streaming_youtube_url`).
  - Endpoint público: `/api/streaming/status` con caché s-maxage=30, stale-while-revalidate=60.
  - Reproductor condicional en el Hero de la landing (`StreamingPlayer`).
- **Videoteca:**
  - Tabla `videos` con orden manual (`display_order`).
  - Cálculo de thumbnail a partir del ID de YouTube.
  - Generación de resúmenes educativos con IA (`generateVideoSummaryAction`).

## 3. Resend Email API
- Envío de emails transaccionales con clave `RESEND_API_KEY`.
- Correo emisor configurado en `RESEND_FROM_PRENSA`.
- Casos de uso:
  - Notificaciones de acreditación a eventos presenciales (`/api/eventos/registro`).
  - Distribución de gacetillas de prensa a medios registrados (`/dashboard/prensa`).
  - Registro de auditoría en `prensa_envios_log`.

## 4. Supabase Storage Buckets
- Buckets existentes:
  - `article-media`: Imágenes y adjuntos de artículos y noticias (lectura pública).
  - `avatars`: Fotos de perfil de miembros (lectura pública, escritura autenticada).
  - `training-docs`: Documentos PDF/TXT para entrenamiento del RAG (lectura pública).
  - `sponsors-logos`: Logos de sponsors en color y monocromo (lectura pública, escritura admin).
  - `saladillo-export-photos`: Fotos de saladillenses en el mundo (lectura pública, escritura pública para testimonios).
