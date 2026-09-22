-- ============================================================
-- ITEC Augusto Cicaré - Migración 036: News media support
-- Agregar soporte para imágenes/videos en news_flashes
-- ============================================================

-- Agregar columna para URLs de archivos multimedia
alter table public.news_flashes
  add column if not exists media_urls jsonb default '[]'::jsonb;