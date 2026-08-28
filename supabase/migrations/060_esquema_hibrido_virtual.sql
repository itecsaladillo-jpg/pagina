-- ─────────────────────────────────────────────────────────────
-- MIGRACIÓN 060: ESQUEMA HÍBRIDO INTEGRAL (Meet + Interacción Realtime)
-- Capacitaciones virtuales con Google Meet como streaming de audio/video
-- y la plataforma ITEC como consola interactiva.
-- ─────────────────────────────────────────────────────────────

-- 1. CAMPOS DE MODALIDAD Y ENLACE EN TABLAS EXISTENTES
-- ─────────────────────────────────────────────────────────────

-- clases_virtuales: agregar modalidad y meet_url
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clases_virtuales' AND column_name = 'modalidad'
  ) THEN
    ALTER TABLE public.clases_virtuales ADD COLUMN modalidad TEXT NOT NULL DEFAULT 'presencial';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clases_virtuales' AND column_name = 'meet_url'
  ) THEN
    ALTER TABLE public.clases_virtuales ADD COLUMN meet_url TEXT;
  END IF;
END
$$;

-- eventos: agregar meet_url y eliminar jitsi_room_name (reemplazado por esquema híbrido Meet)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'eventos' AND column_name = 'meet_url'
  ) THEN
    ALTER TABLE public.eventos ADD COLUMN meet_url TEXT;
  END IF;
END
$$;

-- Eliminar jitsi_room_name si existe (reemplazado por meet_url)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'eventos' AND column_name = 'jitsi_room_name'
  ) THEN
    ALTER TABLE public.eventos DROP COLUMN jitsi_room_name;
  END IF;
END
$$;

-- Comentarios descriptivos
COMMENT ON COLUMN public.clases_virtuales.modalidad IS 'presencial | virtual — define si la clase tiene Meet embebido';
COMMENT ON COLUMN public.clases_virtuales.meet_url IS 'URL de Google Meet para clases virtuales';
COMMENT ON COLUMN public.eventos.meet_url IS 'URL de Google Meet para eventos virtuales';

-- Constraints de validación
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clases_virtuales_modalidad_check'
  ) THEN
    ALTER TABLE public.clases_virtuales
      ADD CONSTRAINT clases_virtuales_modalidad_check
      CHECK (modalidad IN ('presencial', 'virtual'));
  END IF;
END
$$;

-- 2. TABLAS DE INTERACCIÓN REALTIME
-- ─────────────────────────────────────────────────────────────

-- 2a. Modómetro: votos de ritmo de la clase
CREATE TABLE IF NOT EXISTS public.clase_modometro_votos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clase_id UUID NOT NULL REFERENCES public.clases_virtuales(id) ON DELETE CASCADE,
    member_id UUID,
    nombre_completo TEXT NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('voy_bien', 'me_perdi', 'muy_rapido')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT clase_modometro_votos_unique UNIQUE (clase_id, member_id)
);

-- 2b. Mano alzada: cola de pedidos de palabra
CREATE TABLE IF NOT EXISTS public.clase_mano_alzada (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clase_id UUID NOT NULL REFERENCES public.clases_virtuales(id) ON DELETE CASCADE,
    member_id UUID,
    nombre_completo TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'esperando' CHECK (estado IN ('esperando', 'atendido')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2c. Preguntas (Q&A): sistema de preguntas con votación
CREATE TABLE IF NOT EXISTS public.clase_preguntas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clase_id UUID NOT NULL REFERENCES public.clases_virtuales(id) ON DELETE CASCADE,
    member_id UUID,
    nombre_completo TEXT NOT NULL,
    pregunta TEXT NOT NULL,
    votos_count INT NOT NULL DEFAULT 0,
    resuelta BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2d. Votos de preguntas
CREATE TABLE IF NOT EXISTS public.clase_pregunta_votos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pregunta_id UUID NOT NULL REFERENCES public.clase_preguntas(id) ON DELETE CASCADE,
    member_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT clase_pregunta_votos_unique UNIQUE (pregunta_id, member_id)
);

-- 2e. Encuestas en vivo
CREATE TABLE IF NOT EXISTS public.clase_encuestas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clase_id UUID NOT NULL REFERENCES public.clases_virtuales(id) ON DELETE CASCADE,
    pregunta TEXT NOT NULL,
    opciones JSONB NOT NULL DEFAULT '[]'::jsonb,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2f. Respuestas de encuestas
CREATE TABLE IF NOT EXISTS public.clase_encuesta_respuestas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encuesta_id UUID NOT NULL REFERENCES public.clase_encuestas(id) ON DELETE CASCADE,
    member_id UUID NOT NULL,
    nombre_completo TEXT NOT NULL,
    opcion_index INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT clase_encuesta_respuestas_unique UNIQUE (encuesta_id, member_id)
);

-- 2g. Semáforo de comprensión
CREATE TABLE IF NOT EXISTS public.clase_semaforo_votos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clase_id UUID NOT NULL REFERENCES public.clases_virtuales(id) ON DELETE CASCADE,
    member_id UUID,
    nombre_completo TEXT NOT NULL,
    color TEXT NOT NULL CHECK (color IN ('verde', 'amarillo', 'rojo')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT clase_semaforo_votos_unique UNIQUE (clase_id, member_id)
);

-- 3. HABILITAR RLS EN NUEVAS TABLAS
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.clase_modometro_votos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clase_mano_alzada ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clase_preguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clase_pregunta_votos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clase_encuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clase_encuesta_respuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clase_semaforo_votos ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS (lectura/escritura amplia para interacción en vivo)
-- ─────────────────────────────────────────────────────────────

-- Modómetro
DROP POLICY IF EXISTS "clase_modometro_select" ON public.clase_modometro_votos;
CREATE POLICY "clase_modometro_select" ON public.clase_modometro_votos FOR SELECT USING (true);
DROP POLICY IF EXISTS "clase_modometro_insert" ON public.clase_modometro_votos;
CREATE POLICY "clase_modometro_insert" ON public.clase_modometro_votos FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "clase_modometro_update" ON public.clase_modometro_votos;
CREATE POLICY "clase_modometro_update" ON public.clase_modometro_votos FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "clase_modometro_delete" ON public.clase_modometro_votos;
CREATE POLICY "clase_modometro_delete" ON public.clase_modometro_votos FOR DELETE USING (true);

-- Mano alzada
DROP POLICY IF EXISTS "clase_mano_select" ON public.clase_mano_alzada;
CREATE POLICY "clase_mano_select" ON public.clase_mano_alzada FOR SELECT USING (true);
DROP POLICY IF EXISTS "clase_mano_insert" ON public.clase_mano_alzada;
CREATE POLICY "clase_mano_insert" ON public.clase_mano_alzada FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "clase_mano_update" ON public.clase_mano_alzada;
CREATE POLICY "clase_mano_update" ON public.clase_mano_alzada FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "clase_mano_delete" ON public.clase_mano_alzada;
CREATE POLICY "clase_mano_delete" ON public.clase_mano_alzada FOR DELETE USING (true);

-- Preguntas
DROP POLICY IF EXISTS "clase_preguntas_select" ON public.clase_preguntas;
CREATE POLICY "clase_preguntas_select" ON public.clase_preguntas FOR SELECT USING (true);
DROP POLICY IF EXISTS "clase_preguntas_insert" ON public.clase_preguntas;
CREATE POLICY "clase_preguntas_insert" ON public.clase_preguntas FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "clase_preguntas_update" ON public.clase_preguntas;
CREATE POLICY "clase_preguntas_update" ON public.clase_preguntas FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "clase_preguntas_delete" ON public.clase_preguntas;
CREATE POLICY "clase_preguntas_delete" ON public.clase_preguntas FOR DELETE USING (true);

-- Votos de preguntas
DROP POLICY IF EXISTS "clase_pregunta_votos_select" ON public.clase_pregunta_votos;
CREATE POLICY "clase_pregunta_votos_select" ON public.clase_pregunta_votos FOR SELECT USING (true);
DROP POLICY IF EXISTS "clase_pregunta_votos_insert" ON public.clase_pregunta_votos;
CREATE POLICY "clase_pregunta_votos_insert" ON public.clase_pregunta_votos FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "clase_pregunta_votos_delete" ON public.clase_pregunta_votos;
CREATE POLICY "clase_pregunta_votos_delete" ON public.clase_pregunta_votos FOR DELETE USING (true);

-- Encuestas
DROP POLICY IF EXISTS "clase_encuestas_select" ON public.clase_encuestas;
CREATE POLICY "clase_encuestas_select" ON public.clase_encuestas FOR SELECT USING (true);
DROP POLICY IF EXISTS "clase_encuestas_insert" ON public.clase_encuestas;
CREATE POLICY "clase_encuestas_insert" ON public.clase_encuestas FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "clase_encuestas_update" ON public.clase_encuestas;
CREATE POLICY "clase_encuestas_update" ON public.clase_encuestas FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "clase_encuestas_delete" ON public.clase_encuestas;
CREATE POLICY "clase_encuestas_delete" ON public.clase_encuestas FOR DELETE USING (true);

-- Respuestas de encuestas
DROP POLICY IF EXISTS "clase_encuesta_resp_select" ON public.clase_encuesta_respuestas;
CREATE POLICY "clase_encuesta_resp_select" ON public.clase_encuesta_respuestas FOR SELECT USING (true);
DROP POLICY IF EXISTS "clase_encuesta_resp_insert" ON public.clase_encuesta_respuestas;
CREATE POLICY "clase_encuesta_resp_insert" ON public.clase_encuesta_respuestas FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "clase_encuesta_resp_delete" ON public.clase_encuesta_respuestas;
CREATE POLICY "clase_encuesta_resp_delete" ON public.clase_encuesta_respuestas FOR DELETE USING (true);

-- Semáforo
DROP POLICY IF EXISTS "clase_semaforo_select" ON public.clase_semaforo_votos;
CREATE POLICY "clase_semaforo_select" ON public.clase_semaforo_votos FOR SELECT USING (true);
DROP POLICY IF EXISTS "clase_semaforo_insert" ON public.clase_semaforo_votos;
CREATE POLICY "clase_semaforo_insert" ON public.clase_semaforo_votos FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "clase_semaforo_update" ON public.clase_semaforo_votos;
CREATE POLICY "clase_semaforo_update" ON public.clase_semaforo_votos FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "clase_semaforo_delete" ON public.clase_semaforo_votos;
CREATE POLICY "clase_semaforo_delete" ON public.clase_semaforo_votos FOR DELETE USING (true);

-- 5. HABILITAR SUPABASE REALTIME
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'clase_modometro_votos', 'clase_mano_alzada', 'clase_preguntas',
    'clase_pregunta_votos', 'clase_encuestas', 'clase_encuesta_respuestas',
    'clase_semaforo_votos'
  ] LOOP
    IF EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', tbl);
    END IF;
  END LOOP;
END
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.clase_modometro_votos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clase_mano_alzada;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clase_preguntas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clase_pregunta_votos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clase_encuestas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clase_encuesta_respuestas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clase_semaforo_votos;

-- 6. FUNCIÓN RPC: reiniciar semáforo (borra todos los votos de una clase)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.reiniciar_semaforo_clase(p_clase_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.clase_semaforo_votos WHERE clase_id = p_clase_id;
END;
$$;

-- 7. FUNCIÓN RPC: toggle voto de pregunta (inserta o elimina, actualiza contador)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.toggle_pregunta_voto(
  p_pregunta_id UUID,
  p_member_id UUID,
  p_nombre_completo TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.clase_pregunta_votos
    WHERE pregunta_id = p_pregunta_id AND member_id = p_member_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.clase_pregunta_votos
    WHERE pregunta_id = p_pregunta_id AND member_id = p_member_id;
    UPDATE public.clase_preguntas SET votos_count = votos_count - 1 WHERE id = p_pregunta_id;
    RETURN FALSE;
  ELSE
    INSERT INTO public.clase_pregunta_votos (pregunta_id, member_id)
    VALUES (p_pregunta_id, p_member_id);
    UPDATE public.clase_preguntas SET votos_count = votos_count + 1 WHERE id = p_pregunta_id;
    RETURN TRUE;
  END IF;
END;
$$;
