-- ============================================================
-- ITEC Augusto Cicaré - Migración 054: Semáforo de Comprensión v3
-- ============================================================
-- Reconstruye el semáforo desde cero con enfoque ultra liviano:
-- - Sin visitor_id (anonimato absoluto)
-- - Sin voto positivo/negativo: solo registra alertas ("no entiendo")
-- - Solo INSERT + SELECT públicos (sin UPDATE ni DELETE por usuarios)
-- ============================================================

-- 1. Agregar columna de reseteo del semáforo en eventos
--    (Fue eliminada en migración 053, se recrea aquí)
ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS semaforo_last_reset_at TIMESTAMPTZ DEFAULT now();

-- 2. Reinicializar semaforo_last_reset_at en todos los eventos existentes
--    para que los votos anteriores (si hubiera) no afecten el conteo inicial.
UPDATE public.eventos
  SET semaforo_last_reset_at = now()
  WHERE semaforo_last_reset_at IS NULL;

-- 3. Tabla de votos del Semáforo v3 (ultra simplificada)
CREATE TABLE IF NOT EXISTS public.evento_semaforo_votos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id   UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Índice para acelerar consultas por evento_id + created_at (filtro de ventana de tiempo)
CREATE INDEX IF NOT EXISTS idx_semaforo_votos_evento_created
  ON public.evento_semaforo_votos (evento_id, created_at);

-- ============================================================
-- SEGURIDAD: RLS y Políticas
-- ============================================================

ALTER TABLE public.evento_semaforo_votos ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver los votos (para calcular el porcentaje en el cliente)
CREATE POLICY "semaforo_v3_select_public"
  ON public.evento_semaforo_votos FOR SELECT
  USING (true);

-- Cualquiera puede insertar una alerta (asistente anónimo)
CREATE POLICY "semaforo_v3_insert_public"
  ON public.evento_semaforo_votos FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- JSONB herramientas_activas: Re-agregar clave 'semaforo'
-- ============================================================

-- 5. Actualizar eventos existentes para incluir la clave 'semaforo' en false
UPDATE public.eventos
  SET herramientas_activas = herramientas_activas || '{"semaforo": false}'::jsonb
  WHERE NOT (herramientas_activas ? 'semaforo');

-- 6. Actualizar el default de la columna para nuevos eventos
ALTER TABLE public.eventos
  ALTER COLUMN herramientas_activas
  SET DEFAULT '{"encuestas": false, "preguntas": false, "nube": false, "semaforo": false}';

-- ============================================================
-- SUPABASE REALTIME
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'evento_semaforo_votos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.evento_semaforo_votos;
  END IF;
END
$$;
