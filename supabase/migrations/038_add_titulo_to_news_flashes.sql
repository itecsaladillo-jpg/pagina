-- ============================================================
-- ITEC Augusto Cicaré - Migración 038: Agregar columna titulo
-- La tabla news_flashes tiene title, necesitamos titulo
-- ============================================================

alter table public.news_flashes
  add column if not exists titulo text;

-- Copiar datos existentes de title a titulo donde titulo sea null
update public.news_flashes
  set titulo = title
  where titulo is null and title is not null;
