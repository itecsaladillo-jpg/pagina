-- ITEC Augusto Cicaré - Migración 053: Eliminar Semáforo de Comprensión

-- 1. Eliminar la tabla de votos del semáforo
DROP TABLE IF EXISTS public.evento_semaforo_votos CASCADE;

-- 2. Eliminar la columna de reseteo del semáforo en eventos
ALTER TABLE public.eventos DROP COLUMN IF EXISTS semaforo_last_reset_at;

-- 3. Remover la clave 'semaforo' del JSONB herramientas_activas
UPDATE public.eventos
SET herramientas_activas = herramientas_activas - 'semaforo'
WHERE herramientas_activas ? 'semaforo';
