-- ─────────────────────────────────────────────────────────────
-- MIGRACIÓN DE SUPABASE: AGREGAR COLUMNA EN_VIVO A CLASES VIRTUALES
-- Ubicación: supabase/migrations/025_clases_en_vivo.sql
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.clases_virtuales 
ADD COLUMN IF NOT EXISTS en_vivo BOOLEAN NOT NULL DEFAULT FALSE;
