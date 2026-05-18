-- Agregar ID de carpeta de Drive a las comisiones
alter table public.commissions
add column if not exists drive_folder_id text;

-- Agregar ID de carpeta raíz institucional
alter table public.site_settings
add column if not exists google_drive_root_id text;
