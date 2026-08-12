-- ─────────────────────────────────────────
-- Migración 064: Configuración de Streaming en Landing Page
-- ─────────────────────────────────────────
-- Inserta valores iniciales para el control de transmisión abierta
-- en la tabla api_settings existente.

-- Insertar configuración de streaming (valores por defecto)
INSERT INTO public.api_settings (key, value) VALUES
  ('streaming_active', 'false'),
  ('streaming_youtube_url', '')
ON CONFLICT (key) DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE public.api_settings IS 'Configuración global del sitio (key-value). Incluye settings de streaming.';
