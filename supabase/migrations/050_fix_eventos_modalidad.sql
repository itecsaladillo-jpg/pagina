-- ============================================================
-- ITEC Augusto Cicaré - Migración 050: Fix columna modalidad en eventos
-- ============================================================

alter table public.eventos
  add column if not exists modalidad text not null default 'presencial'
    check (modalidad in ('presencial', 'virtual'));
