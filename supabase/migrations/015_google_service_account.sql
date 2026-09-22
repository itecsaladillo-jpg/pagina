-- Agregar columna para el JSON de la Cuenta de Servicio de Google
alter table public.site_settings
add column if not exists google_service_account_json text;

comment on column public.site_settings.google_service_account_json is 'Contenido del archivo JSON de la Cuenta de Servicio de Google Cloud.';
