-- ============================================================
-- ITEC Augusto Cicaré - Migración 033: News multicanal
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- ─────────────────────────────────────────
-- MODIFICAR TABLA: news_flashes (comunicaciones)
-- Agregar columnas para estrategia multicanal
-- ─────────────────────────────────────────

-- Agregar columnas de texto por canal
alter table public.news_flashes
  add column if not exists texto_publico text,
  add column if not exists texto_miembros text,
  add column if not exists texto_sponsors text,
  add column if not exists texto_medios text,
  add column if not exists datos_crudos text;

-- Agregar columnas booleanas de destino
alter table public.news_flashes
  add column if not exists para_publico boolean not null default false,
  add column if not exists para_miembros boolean not null default true,
  add column if not exists para_sponsors boolean not null default false,
  add column if not exists para_medios boolean not null default false;

-- ─────────────────────────────────────────
-- TABLA: news_sponsors (registro de vistas por sponsors)
-- ─────────────────────────────────────────

create table if not exists public.news_sponsors (
  id               uuid primary key default uuid_generate_v4(),
  created_at       timestamptz not null default now(),
  news_flash_id    uuid not null references public.news_flashes(id) on delete cascade,
  sponsor_id       uuid not null references public.sponsors(id) on delete cascade,
  visto_por        jsonb default '[]'  -- [{email: "...", fecha: "2025-01-15T10:30:00Z"}]
);

-- RLS para news_sponsors
alter table public.news_sponsors enable row level security;

-- Sponsors pueden ver sus propios registros
create policy if not exists "Sponsors ven sus registros"
  on public.news_sponsors for select
  using (
    exists (
      select 1 from public.sponsors
      where id = sponsor_id
    )
    or exists (
      select 1 from public.members
      where id = auth.uid()
      and role in ('admin', 'coordinador')
      and status = 'activo'
    )
  );

-- Admins pueden insertar/actualizar
create policy if not exists "Admins gestionan registros de news_sponsors"
  on public.news_sponsors for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
      and role = 'admin'
      and status = 'activo'
    )
  );

-- Trigger updated_at
create trigger if not exists set_updated_at before update on public.news_flashes
  for each row execute function public.handle_updated_at();

-- ─────────────────────────────────────────
-- RLS: Actualizar políticas para news_flashes
-- ─────────────────────────────────────────

-- Política de lectura pública: solo texto_publico (sin autenticación)
drop policy if exists "Noticias visibles para miembros activos" on public.news_flashes;

create policy "Noticias públicas visibles sin auth"
  on public.news_flashes for select
  using (
    para_publico = true
    and texto_publico is not null
  );

-- Política de lectura protegida: texto_miembros para usuarios autenticados
create policy "Noticias para miembros autenticados"
  on public.news_flashes for select
  using (
    auth.role() = 'authenticated'
    and (para_miembros = true or texto_miembros is not null)
  );

-- Política completa: admins/coordinadores ven todo
drop policy if exists "Admins y coordinadores crean noticias" on public.news_flashes;
drop policy if exists "Admins y coordinadores editan noticias" on public.news_flashes;

create policy "Admins y coordinadores crean noticias"
  on public.news_flashes for insert
  with check (
    exists (
      select 1 from public.members
      where id = auth.uid()
      and role in ('admin', 'coordinador')
      and status = 'activo'
    )
  );

create policy "Admins y coordinadores editan noticias"
  on public.news_flashes for update
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
      and role in ('admin', 'coordinador')
      and status = 'activo'
    )
  );