-- ============================================================
-- ITEC Augusto Cicaré - Migración 021: Nube de Ideas Multi-nube
-- ============================================================

-- 1. Crear la tabla public.evento_nubes si no existe
create table if not exists public.evento_nubes (
  id          uuid primary key default uuid_generate_v4(),
  evento_id   uuid not null references public.itec_actions(id) on delete cascade,
  nombre      text not null,
  created_at  timestamptz not null default now()
);

-- 2. Asegurar la existencia de la tabla public.evento_nube_palabras
create table if not exists public.evento_nube_palabras (
  id          uuid primary key default uuid_generate_v4(),
  evento_id   uuid references public.itec_actions(id) on delete cascade,
  palabra     text not null,
  created_at  timestamptz not null default now()
);

-- 3. Agregar columnas nube_id y dispositivo_id a public.evento_nube_palabras
alter table public.evento_nube_palabras 
  add column if not exists nube_id uuid references public.evento_nubes(id) on delete cascade,
  add column if not exists dispositivo_id text;

-- 3.1. Crear índices únicos parciales para restringir una sola palabra por dispositivo
-- Si nube_id no es nulo, restringir una palabra por dispositivo y nube
drop index if exists public.evento_nube_palabras_nube_dispositivo_idx;
create unique index evento_nube_palabras_nube_dispositivo_idx 
  on public.evento_nube_palabras (nube_id, dispositivo_id) 
  where nube_id is not null;

-- Si nube_id es nulo (nube general del evento), restringir una palabra por dispositivo y evento
drop index if exists public.evento_nube_palabras_evento_dispositivo_null_nube_idx;
create unique index evento_nube_palabras_evento_dispositivo_null_nube_idx 
  on public.evento_nube_palabras (evento_id, dispositivo_id) 
  where nube_id is null;

-- 4. Habilitar Seguridad (RLS)
alter table public.evento_nubes enable row level security;
alter table public.evento_nube_palabras enable row level security;

-- 5. Políticas para public.evento_nubes
drop policy if exists "Cualquiera puede ver nubes de eventos" on public.evento_nubes;
create policy "Cualquiera puede ver nubes de eventos"
  on public.evento_nubes for select
  using (true);

drop policy if exists "Staff activo gestiona nubes" on public.evento_nubes;
create policy "Staff activo gestiona nubes"
  on public.evento_nubes for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
        and role in ('admin', 'coordinador', 'colaborador')
    )
  );

-- 6. Políticas para public.evento_nube_palabras
drop policy if exists "Cualquiera puede insertar palabras" on public.evento_nube_palabras;
create policy "Cualquiera puede insertar palabras"
  on public.evento_nube_palabras for insert
  with check (true);

drop policy if exists "Cualquiera puede ver palabras" on public.evento_nube_palabras;
create policy "Cualquiera puede ver palabras"
  on public.evento_nube_palabras for select
  using (true);

drop policy if exists "Staff activo gestiona palabras" on public.evento_nube_palabras;
create policy "Staff activo gestiona palabras"
  on public.evento_nube_palabras for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
        and role in ('admin', 'coordinador', 'colaborador')
    )
  );
