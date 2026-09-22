-- ============================================================
-- ITEC Augusto Cicaré - Migración 020: Asegurar Columnas de Auditoría y Permisos al rol Colaborador
-- ============================================================

-- 1. Asegurar la existencia de la columna created_at en la tabla de preguntas
alter table public.evento_preguntas add column if not exists created_at timestamptz not null default now();

-- 2. Asegurar la existencia de la columna created_at en la tabla de likes
alter table public.evento_preguntas_likes add column if not exists created_at timestamptz not null default now();

-- 3. Actualizar políticas de la tabla public.evento_preguntas para incluir el rol 'colaborador'
drop policy if exists "Cualquiera puede ver preguntas aprobadas" on public.evento_preguntas;
create policy "Cualquiera puede ver preguntas aprobadas"
  on public.evento_preguntas for select
  using (
    aprobada = true or exists (
      select 1 from public.members
      where id = auth.uid()
        and role in ('admin', 'coordinador', 'colaborador')
    )
  );

drop policy if exists "Staff activo gestiona preguntas" on public.evento_preguntas;
create policy "Staff activo gestiona preguntas"
  on public.evento_preguntas for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
        and role in ('admin', 'coordinador', 'colaborador')
    )
  );
