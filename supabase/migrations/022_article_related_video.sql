-- ============================================================
-- ITEC Augusto Cicaré - Migración 022: Video relacionado en artículos
-- ============================================================

-- Agregar columna opcional related_video_id a public_articles
ALTER TABLE public.public_articles
  ADD COLUMN IF NOT EXISTS related_video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.public_articles.related_video_id IS
  'ID del video en la videoteca relacionado con este artículo del Muro de Impacto.';
