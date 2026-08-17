-- ============================================================
-- ITEC Augusto Cicaré - Migración 065: Update Sponsors
-- ============================================================

ALTER TABLE public.sponsors
  ADD COLUMN IF NOT EXISTS rubro text,
  ADD COLUMN IF NOT EXISTS resena text,
  ADD COLUMN IF NOT EXISTS contacto_nombre text,
  ADD COLUMN IF NOT EXISTS contacto_telefono text,
  ADD COLUMN IF NOT EXISTS logo_monocromo_url text,
  ADD COLUMN IF NOT EXISTS logo_color_url text;

-- Update tier constraint to include 'standard'
ALTER TABLE public.sponsors DROP CONSTRAINT IF EXISTS sponsors_tier_check;
ALTER TABLE public.sponsors ADD CONSTRAINT sponsors_tier_check CHECK (tier IN ('platino', 'oro', 'plata', 'bronce', 'standard'));
