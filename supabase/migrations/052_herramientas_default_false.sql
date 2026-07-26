-- ============================================================
-- ITEC Augusto Cicaré - Migración 052: Default herramientas en false
-- ============================================================
-- Cambia el estado inicial de las herramientas interactivas a
-- desactivado por defecto (todas en false).
-- ============================================================

-- 1. Alterar el default de la columna para nuevos eventos
alter table public.eventos
  alter column herramientas_activas
  set default '{"encuestas": false, "preguntas": false, "nube": false, "semaforo": false}';

-- 2. Actualizar eventos existentes que tengan el default anterior u otros valores
--    para que todas las herramientas comiencen en false.
update public.eventos
  set herramientas_activas = '{"encuestas": false, "preguntas": false, "nube": false, "semaforo": false}'
  where herramientas_activas is null
     or herramientas_activas = '{"encuestas": true, "preguntas": true, "nube": true, "semaforo": true}';
