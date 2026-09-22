-- ============================================================
-- ITEC Augusto Cicaré - Migración 051: Control modular herramientas
-- ============================================================

-- 1. Columna JSONB para switches individuales por herramienta
alter table public.eventos
  add column if not exists herramientas_activas jsonb
    not null default '{"encuestas": true, "preguntas": true, "nube": true, "semaforo": true}';

-- 2. Columna para selector de proyección en pantalla gigante
alter table public.eventos
  add column if not exists modo_pantalla_gigante text
    not null default 'bienvenida'
    check (modo_pantalla_gigante in ('bienvenida', 'nube', 'encuestas', 'preguntas'));
