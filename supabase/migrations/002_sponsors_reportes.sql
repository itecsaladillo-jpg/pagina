-- ============================================================
-- ITEC Augusto Cicaré - Migración 002: Sponsors & Reportes
-- Ejecutar DESPUÉS de 001_initial_schema.sql
-- ============================================================

-- ─────────────────────────────────────────
-- TABLA: sponsors (Empresas / Organizaciones patrocinadoras)
-- ─────────────────────────────────────────

create table public.sponsors (
  id             uuid primary key default uuid_generate_v4(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  name           text not null,
  logo_url       text,
  website_url    text,
  contact_email  text,
  tier           text not null default 'bronce'
                   check (tier in ('platino','oro','plata','bronce')),
  is_active      boolean not null default true,
  description    text,
  -- Enlace privado único para acceso a reportes de impacto
  private_token  uuid not null default uuid_generate_v4() unique
);

alter table public.sponsors enable row level security;

-- Sponsors visibles solo para admins y coordinadores
create policy "Sponsors visibles para admins"
  on public.sponsors for select
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
        and role in ('admin', 'coordinador')
        and status = 'activo'
    )
  );

create policy "Solo admins pueden crear/editar sponsors"
  on public.sponsors for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
        and role = 'admin'
        and status = 'activo'
    )
  );

-- ─────────────────────────────────────────
-- TABLA: sponsor_reports (Reportes de Impacto)
-- ─────────────────────────────────────────

create table public.sponsor_reports (
  id              uuid primary key default uuid_generate_v4(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  sponsor_id      uuid not null references public.sponsors(id) on delete cascade,
  period_label    text not null,              -- e.g. "Q1 2025", "Mayo 2025"
  period_start    date not null,
  period_end      date not null,
  -- Métricas de impacto (JSONB flexible para evolucionar sin migraciones)
  metrics         jsonb not null default '{}',
  -- Ejemplo de métricas:
  -- {
  --   "miembros_alcanzados": 120,
  --   "capacitaciones_realizadas": 4,
  --   "ideas_apoyadas": 7,
  --   "horas_formacion": 32
  -- }
  summary_html    text,                       -- Reporte narrativo en HTML
  is_published    boolean not null default false,
  published_at    timestamptz
);

alter table public.sponsor_reports enable row level security;

-- Admins y coordinadores ven todos los reportes
create policy "Reportes visibles para admins y coordinadores"
  on public.sponsor_reports for select
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
        and role in ('admin', 'coordinador')
        and status = 'activo'
    )
  );

-- Sponsors acceden a sus propios reportes publicados vía token
-- (se usará una Edge Function o API Route para validar el token)
create policy "Solo admins crean reportes"
  on public.sponsor_reports for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
        and role = 'admin'
        and status = 'activo'
    )
  );

-- ─────────────────────────────────────────
-- TRIGGER: updated_at para nuevas tablas
-- ─────────────────────────────────────────

create trigger set_updated_at before update on public.sponsors
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.sponsor_reports
  for each row execute function public.handle_updated_at();

-- ─────────────────────────────────────────
-- AGREGAR streaming y video a trainings
-- (complementa la tabla existente)
-- ─────────────────────────────────────────

alter table public.trainings
  add column if not exists streaming_url text,
  add column if not exists recording_url text,
  add column if not exists is_public      boolean not null default false;

-- Capacitaciones públicas visibles sin autenticación
drop policy if exists "Capacitaciones visibles para autenticados" on public.trainings;

create policy "Capacitaciones públicas o para autenticados"
  on public.trainings for select
  using (
    is_public = true
    or auth.role() = 'authenticated'
  );
