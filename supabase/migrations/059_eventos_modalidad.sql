-- ─────────────────────────────────────────
-- Migración 059: Agregar modalidad virtual a eventos
-- ─────────────────────────────────────────

-- Columna modalidad (presencial | virtual)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'eventos' AND column_name = 'modalidad'
  ) THEN
    ALTER TABLE public.eventos ADD COLUMN modalidad TEXT NOT NULL DEFAULT 'presencial';
  END IF;
END
$$;

-- Columna jitsi_room_name (solo para eventos virtuales)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'eventos' AND column_name = 'jitsi_room_name'
  ) THEN
    ALTER TABLE public.eventos ADD COLUMN jitsi_room_name TEXT;
  END IF;
END
$$;

-- Validar que modalidad sea uno de los valores permitidos (si no existe ya)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'eventos_modalidad_check'
  ) THEN
    ALTER TABLE public.eventos
      ADD CONSTRAINT eventos_modalidad_check
      CHECK (modalidad IN ('presencial', 'virtual'));
  END IF;
END
$$;

-- Comentario descriptivo
COMMENT ON COLUMN public.eventos.modalidad IS 'Tipo de evento: presencial (con QR y pantalla gigante) o virtual (con Jitsi embebido)';
COMMENT ON COLUMN public.eventos.jitsi_room_name IS 'Nombre de la sala Jitsi Meet para eventos virtuales (ej: ITEC_Saladillo_Evento_charla-ciber)';
