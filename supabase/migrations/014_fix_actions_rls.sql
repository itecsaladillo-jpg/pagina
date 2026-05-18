-- ============================================================
-- ITEC Augusto Cicaré - Migración 014: Corrección Resiliente de Políticas RLS y Tablas
-- ============================================================

-- 1. Asegurar que las tablas existan antes de modificar sus políticas
create table if not exists public.itec_actions (
  id               uuid primary key default uuid_generate_v4(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  title            text not null,
  description      text,
  type             text not null check (type in ('capacitacion', 'evento_social', 'divulgacion')),
  status           text not null default 'planificacion' 
                     check (status in ('planificacion', 'en_curso', 'finalizada', 'cancelada')),
  target_audience  text,
  capacity         integer,
  cost             numeric(10,2) default 0,
  start_date       timestamptz,
  end_date         timestamptz,
  location         text,
  thumbnail_url    text,
  tags             text[] not null default '{}',
  responsible_id   uuid references public.members(id) on delete set null,
  commission_id    uuid references public.commissions(id) on delete set null,
  materials_urls   text[] not null default '{}'
);

create table if not exists public.action_registrations (
  id             uuid primary key default uuid_generate_v4(),
  action_id      uuid not null references public.itec_actions(id) on delete cascade,
  full_name      text not null,
  email          text not null,
  phone          text,
  registered_at  timestamptz not null default now(),
  attended       boolean not null default false,
  notes          text
);

-- Habilitar RLS
alter table public.itec_actions enable row level security;
alter table public.action_registrations enable row level security;

-- 2. Políticas para itec_actions
drop policy if exists "Gestión total para staff activo" on public.itec_actions;
create policy "Gestión total para staff activo"
  on public.itec_actions for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
        and role in ('admin', 'coordinador')
    )
  );

drop policy if exists "Responsables gestionan sus propias acciones" on public.itec_actions;
create policy "Responsables gestionan sus propias actions" on public.itec_actions;
create policy "Responsables gestionan sus propias acciones"
  on public.itec_actions for all
  using (auth.uid() = responsible_id)
  with check (auth.uid() = responsible_id);

drop policy if exists "Acciones visibles para todos" on public.itec_actions;
create policy "Acciones visibles para todos"
  on public.itec_actions for select
  using (true);

-- 3. Políticas para action_registrations
drop policy if exists "Staff activo gestiona inscripciones" on public.action_registrations;
create policy "Staff activo gestiona inscripciones"
  on public.action_registrations for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
        and role in ('admin', 'coordinador')
    )
  );

drop policy if exists "Cualquiera puede inscribirse a una acción" on public.action_registrations;
create policy "Cualquiera puede inscribirse a una acción"
  on public.action_registrations for insert
  with check (true);
