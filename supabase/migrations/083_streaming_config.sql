-- ─────────────────────────────────────────────────────────
-- Migración 083: Tabla streaming_config y políticas RLS
-- ─────────────────────────────────────────────────────────
-- Permite almacenar y gestionar el estado del reproductor de
-- transmisión en vivo de YouTube para la página principal.

CREATE TABLE IF NOT EXISTS public.streaming_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  streaming_enabled BOOLEAN NOT NULL DEFAULT false,
  youtube_url TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Asegurar que la fila por defecto exista
INSERT INTO public.streaming_config (id, streaming_enabled, youtube_url)
VALUES ('default', false, '')
ON CONFLICT (id) DO NOTHING;

-- Habilitar Row Level Security
ALTER TABLE public.streaming_config ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública (para frontend anónimo y landing page)
DROP POLICY IF EXISTS "streaming_config select public" ON public.streaming_config;
CREATE POLICY "streaming_config select public"
  ON public.streaming_config FOR SELECT
  USING (true);

-- Política de modificación para administradores y coordinadores
DROP POLICY IF EXISTS "streaming_config modify admin" ON public.streaming_config;
CREATE POLICY "streaming_config modify admin"
  ON public.streaming_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE id = auth.uid() AND role IN ('admin', 'coordinador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE id = auth.uid() AND role IN ('admin', 'coordinador')
    )
  );

COMMENT ON TABLE public.streaming_config IS 'Configuración del reproductor de streaming en vivo en el home (streaming_enabled, youtube_url).';
