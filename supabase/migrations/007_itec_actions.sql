-- ============================================================
-- ITEC Augusto Cicaré - Migración 007: Acciones de Impacto Externo
-- ============================================================

-- 1. Crear la tabla de Acciones de ITEC (Unificación de Capacitaciones y Eventos)
create table if not exists public.itec_actions (
  id               uuid primary key default uuid_generate_v4(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  title            text not null,
  description      text,
  type             text not null check (type in ('capacitacion', 'evento_social', 'divulgacion')),
  status           text not null default 'planificacion' 
                     check (status in ('planificacion', 'en_curso', 'finalizada', 'cancelada')),
  
  -- Detalles de Impacto
  target_audience  text,           -- Público objetivo
  capacity         integer,        -- Cupo
  cost             numeric(10,2) default 0, -- Costo (0 si es gratis)
  
  -- Logística
  start_date       timestamptz,
  end_date         timestamptz,
  location         text,
  thumbnail_url    text,
  tags             text[] not null default '{}',
  
  -- Vinculación Interna
  responsible_id   uuid references public.members(id) on delete set null,
  commission_id    uuid references public.commissions(id) on delete set null,
  
  -- Materiales (links a Storage o Drive)
  materials_urls   text[] not null default '{}'
);

-- 2. Migrar datos existentes de 'trainings' a 'itec_actions' si aplica
-- (Asumimos que 'trainings' ya no se usará directamente o se mantendrá como legacy)
insert into public.itec_actions (
  id, created_at, updated_at, title, description, type, status, 
  start_date, end_date, location, capacity, thumbnail_url, tags, responsible_id, commission_id
)
select 
  id, created_at, updated_at, title, description, 'capacitacion', status,
  start_date, end_date, location, max_participants, thumbnail_url, tags, instructor_id, commission_id
from public.trainings
on conflict (id) do nothing;

-- 3. Tabla de Inscripciones Externas (Público General de Saladillo)
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

-- 4. Seguridad (RLS)
alter table public.itec_actions enable row level security;
alter table public.action_registrations enable row level security;

-- Visibilidad Pública
create policy "Acciones visibles para todos"
  on public.itec_actions for select
  using (true);

-- Inscripciones Externas (Cualquiera puede inscribirse)
create policy "Cualquiera puede inscribirse a una acción"
  on public.action_registrations for insert
  with check (true);

-- Los administradores/coordinadores gestionan todo
create policy "Gestión total para staff activo"
  on public.itec_actions for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
        and role in ('admin', 'coordinador')
        and status = 'activo'
    )
  );

create policy "Staff activo gestiona inscripciones"
  on public.action_registrations for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
        and role in ('admin', 'coordinador')
        and status = 'activo'
    )
  );

-- 5. Trigger updated_at
create trigger set_updated_at before update on public.itec_actions
  for each row execute function public.handle_updated_at();
