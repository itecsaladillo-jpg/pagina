-- ─────────────────────────────────────────
-- Migración 061: Agregar general_meet_url a site_settings
-- ─────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'site_settings' AND column_name = 'general_meet_url'
  ) THEN
    ALTER TABLE public.site_settings ADD COLUMN general_meet_url TEXT;
  END IF;
END
$$;

COMMENT ON COLUMN public.site_settings.general_meet_url IS 'URL de Google Meet persistente para la Sala de Reuniones General del staff';
