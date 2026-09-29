---
name: itec-verify-integrations-cloud
description: "Checklist de verificación de integraciones cloud en ITEC"
---

# Verificación de Integraciones Cloud

## Google Drive API
- [ ] Service Account JSON almacenado en `site_settings.google_service_account_json` (NO en .env)
- [ ] `google_drive_root_id` configurado en `site_settings`
- [ ] Mapeo slug→folder por comisión + carpeta general configurable
- [ ] `src/services/drive.ts`, `src/lib/drive.ts` funcionan correctamente
- [ ] `/dashboard/drive` permite explorar Drive por comisión

## YouTube Live Streaming
- [ ] `api_settings` keys: `streaming_active`, `streaming_youtube_url`
- [ ] Toggle ON/OFF de transmisión
- [ ] Configuración de URL YouTube y setup OBS
- [ ] `NEXT_PUBLIC_MEET_LINK` configurado
- [ ] `/dashboard/streaming` funciona correctamente

## Videoteca
- [ ] `videos`: `display_order`, `ai_summary`, thumbnail recalculado
- [ ] Resúmenes ejecutivos generados por IA (`generateVideoSummaryAction`)
- [ ] `/dashboard/videoteca` permite ABM de videos

## Resend Email API
- [ ] `RESEND_API_KEY` configurado en `.env.local`
- [ ] `RESEND_FROM_PRENSA` configurado en `.env.local`
- [ ] `src/lib/email.ts` funciona correctamente
- [ ] Plantillas en `src/lib/email-templates/prensa.ts`
- [ ] Envío de gacetillas de prensa funciona

## Supabase Storage Buckets
- [ ] `article-media`: Multimedia de artículos (público lectura)
- [ ] `avatars`: Subida de avatar de perfil
- [ ] `training-docs`: Documentos de entrenamiento (P3 del RAG, público lectura)
- [ ] `sponsors-logos`: SELECT público; INSERT autenticado admin/coordinador
- [ ] `saladillo-export-photos`: SELECT público; INSERT público ( formulário de creación de testimonios)

## Google Meet
- [ ] `NEXT_PUBLIC_MEET_LINK` configurado
- [ ] `site_settings.general_meet_url` (col. desde mig. 061)
- [ ] Sala de reuniones general con enlace Meet persistente
- [ ] `/dashboard/reuniones` + `GeneralMeetingRoom.tsx` funcionan