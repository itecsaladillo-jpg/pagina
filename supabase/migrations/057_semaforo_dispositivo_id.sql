-- ============================================================
-- ITEC Augusto Cicaré - Migración 057: Semáforo - Un voto por dispositivo por ciclo
-- ============================================================
-- Agrega columna dispositivo_id para identificar dispositivos anónimos.
-- Permite verificar si un dispositivo ya votó en el ciclo actual
-- (desde semaforo_last_reset_at) y bloquear votos duplicados.
-- ============================================================

-- 1. Agregar columna dispositivo_id
ALTER TABLE public.evento_semaforo_votos
  ADD COLUMN IF NOT EXISTS dispositivo_id TEXT NOT NULL DEFAULT '';

-- 2. Índice compuesto para optimizar verificación de voto único por ciclo:
--    WHERE evento_id = ? AND dispositivo_id = ? AND created_at >= resetAt
CREATE INDEX IF NOT EXISTS idx_semaforo_votos_evento_dispositivo_created
  ON public.evento_semaforo_votos (evento_id, dispositivo_id, created_at);

-- 3. Eliminar índice anterior (ya no es óptimo para las consultas principales)
DROP INDEX IF EXISTS public.idx_semaforo_votos_evento_created;
