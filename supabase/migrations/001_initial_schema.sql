-- ============================================================
-- ITEC Augusto Cicaré - Schema inicial Supabase
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- Habilitar extensiones necesarias
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- TABLA: members
-- ─────────────────────────────────────────
create table public.members (
  id           uuid primary key references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  full_name    text not null,
  email        text not null unique,
  avatar_url   text,
  role         text not null default 'miembro'
                 check (role in ('admin','coordinador','miembro','colaborador')),
  status       text not null default 'pendiente'
                 check (status in ('activo','inactivo','pendiente')),
  bio          text,
  linkedin_url text,
  phone        text,
  join_date    date not null default current_date
);

-- RLS
alter table public.members enable row level security;

create policy "Miembros activos pueden ver el directorio"
  on public.members for select
  using (auth.role() = 'authenticated');

create policy "Cada usuario gestiona su propio perfil"
  on public.members for update
  using (auth.uid() = id);

-- ─────────────────────────────────────────
-- TABLA: commissions
-- ─────────────────────────────────────────
create table public.commissions (
  id             uuid primary key default uuid_generate_v4(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  name           text not null,
  slug           text not null unique,
  description    text,
  icon           text,
  color          text,
  is_active      boolean not null default true,
  coordinator_id uuid references public.members(id) on delete set null
);

alter table public.commissions enable row level security;

create policy "Comisiones visibles para todos los autenticados"
  on public.commissions for select
  using (auth.role() = 'authenticated');

-- ─────────────────────────────────────────
-- TABLA: commission_members
-- ─────────────────────────────────────────
create table public.commission_members (
  id              uuid primary key default uuid_generate_v4(),
  commission_id   uuid not null references public.commissions(id) on delete cascade,
  member_id       uuid not null references public.members(id) on delete cascade,
  joined_at       timestamptz not null default now(),
  is_coordinator  boolean not null default false,
  unique (commission_id, member_id)
);

alter table public.commission_members enable row level security;

create policy "Miembros de comisión visibles para autenticados"
  on public.commission_members for select
  using (auth.role() = 'authenticated');

-- ─────────────────────────────────────────
-- TABLA: trainings
-- ─────────────────────────────────────────
create table public.trainings (
  id               uuid primary key default uuid_generate_v4(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  title            text not null,
  description      text,
  instructor_name  text,
  instructor_id    uuid references public.members(id) on delete set null,
  commission_id    uuid references public.commissions(id) on delete set null,
  status           text not null default 'planificada'
                     check (status in ('planificada','en_curso','finalizada','cancelada')),
  start_date       timestamptz,
  end_date         timestamptz,
  location         text,
  max_participants integer,
  thumbnail_url    text,
  tags             text[] not null default '{}'
);

alter table public.trainings enable row level security;

create policy "Capacitaciones visibles para autenticados"
  on public.trainings for select
  using (auth.role() = 'authenticated');

-- ─────────────────────────────────────────
-- TABLA: training_enrollments
-- ─────────────────────────────────────────
create table public.training_enrollments (
  id              uuid primary key default uuid_generate_v4(),
  training_id     uuid not null references public.trainings(id) on delete cascade,
  member_id       uuid not null references public.members(id) on delete cascade,
  enrolled_at     timestamptz not null default now(),
  attended        boolean not null default false,
  certificate_url text,
  unique (training_id, member_id)
);

alter table public.training_enrollments enable row level security;

create policy "Cada miembro ve sus propias inscripciones"
  on public.training_enrollments for select
  using (auth.uid() = member_id);

-- ─────────────────────────────────────────
-- TABLA: ideas (Buzón de Feedback)
-- ─────────────────────────────────────────
create table public.ideas (
  id            uuid primary key default uuid_generate_v4(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  title         text not null,
  description   text not null,
  author_id     uuid references public.members(id) on delete set null,
  author_name   text,
  commission_id uuid references public.commissions(id) on delete set null,
  status        text not null default 'nueva'
                  check (status in ('nueva','en_revision','aprobada','rechazada','implementada')),
  upvotes       integer not null default 0,
  is_anonymous  boolean not null default false,
  tags          text[] not null default '{}',
  admin_notes   text
);

alter table public.ideas enable row level security;

create policy "Ideas visibles para autenticados"
  on public.ideas for select
  using (auth.role() = 'authenticated');

create policy "Cualquier autenticado puede enviar ideas"
  on public.ideas for insert
  with check (auth.role() = 'authenticated');

-- Función para incrementar upvotes de forma atómica
create or replace function public.increment_upvotes(idea_id uuid)
returns void
language sql
security definer
as $$
  update public.ideas
  set upvotes = upvotes + 1
  where id = idea_id;
$$;

-- ─────────────────────────────────────────
-- TRIGGER: updated_at automático
-- ─────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.members
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.commissions
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.trainings
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.ideas
  for each row execute function public.handle_updated_at();

-- ─────────────────────────────────────────
-- AUTO-CREAR MIEMBRO AL REGISTRARSE
-- ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.members (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
