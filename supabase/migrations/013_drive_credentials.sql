-- Migración para agregar credenciales de Google Drive a site_settings
-- Ejecutar en el SQL Editor de Supabase

alter table public.site_settings 
add column if not exists google_drive_email text,
add column if not exists google_drive_password text;

comment on column public.site_settings.google_drive_password is 'Se recomienda usar una Contraseña de Aplicación si la cuenta tiene 2FA.';
