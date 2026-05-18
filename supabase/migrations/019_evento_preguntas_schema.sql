-- ============================================================
-- ITEC Augusto Cicaré - Migración 019: Estructura Resiliente de Preguntas en Vivo y Likes
-- ============================================================

-- 1. Crear la tabla evento_preguntas si no existe
create table if not exists public.evento_preguntas (
  id          uuid primary key default uuid_generate_v4(),
  evento_id   uuid not null references public.itec_actions(id) on delete cascade,
  pregunta    text not null,
  aprobada    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Asegurar la existencia de todas las columnas (por si la tabla ya existía sin ellas)
alter table public.evento_preguntas add column if not exists nombre text not null default 'Anónimo';
alter table public.evento_preguntas add column if not exists pregunta text not null default '';
alter table public.evento_preguntas add column if not exists aprobada boolean not null default false;

-- 2. Crear la tabla de likes de preguntas en vivo
create table if not exists public.evento_preguntas_likes (
  id           uuid primary key default uuid_generate_v4(),
  pregunta_id  uuid not null references public.evento_preguntas(id) on delete cascade,
  created_at   timestamptz not null default now()
);

-- 3. Habilitar Seguridad (RLS)
alter table public.evento_preguntas enable row level security;
alter table public.evento_preguntas_likes enable row level security;

-- 4. Políticas para la tabla de preguntas
drop policy if exists "Cualquiera puede insertar preguntas" on public.evento_preguntas;
create policy "Cualquiera puede insertar preguntas"
  on public.evento_preguntas for insert
  with check (true);

drop policy if exists "Cualquiera puede ver preguntas aprobadas" on public.evento_preguntas;
create policy "Cualquiera puede ver preguntas aprobadas"
  on public.evento_preguntas for select
  using (
    aprobada = true or exists (
      select 1 from public.members
      where id = auth.uid()
        and role in ('admin', 'coordinador')
    )
  );

drop policy if exists "Staff activo gestiona preguntas" on public.evento_preguntas;
create policy "Staff activo gestiona preguntas"
  on public.evento_preguntas for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
        and role in ('admin', 'coordinador')
    )
  );

-- 5. Políticas para la tabla de likes
drop policy if exists "Cualquiera puede dar like" on public.evento_preguntas_likes;
create policy "Cualquiera puede dar like"
  on public.evento_preguntas_likes for insert
  with check (true);

drop policy if exists "Cualquiera puede ver likes" on public.evento_preguntas_likes;
create policy "Cualquiera puede ver likes"
  on public.evento_preguntas_likes for select
  using (true);
