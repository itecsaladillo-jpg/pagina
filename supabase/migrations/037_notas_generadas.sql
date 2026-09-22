-- ============================================================
-- ITEC Augusto Cicaré - Migración 037: Notas generadas multicanal
-- Tablas dedicadas para cada tipo de nota generada por IA
-- ============================================================

-- ─────────────────────────────────────────
-- TABLA: notas_publico (notas para el público general)
-- ─────────────────────────────────────────
create table if not exists public.notas_publico (
  id               uuid primary key default uuid_generate_v4(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  news_flash_id    uuid references public.news_flashes(id) on delete set null,
  titulo           text not null,
  contenido        text not null,
  autor_id         uuid references public.members(id) on delete set null,
  is_published     boolean not null default true,
  media_urls       jsonb default '[]',
  slug             text unique
);

-- ─────────────────────────────────────────
-- TABLA: notas_miembros (comunicación interna)
-- ─────────────────────────────────────────
create table if not exists public.notas_miembros (
  id               uuid primary key default uuid_generate_v4(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  news_flash_id    uuid references public.news_flashes(id) on delete set null,
  titulo           text not null,
  contenido        text not null,
  autor_id         uuid references public.members(id) on delete set null,
  is_published     boolean not null default true,
  media_urls       jsonb default '[]'
);

-- ─────────────────────────────────────────
-- TABLA: notas_sponsors (reportes para sponsors)
-- ─────────────────────────────────────────
create table if not exists public.notas_sponsors (
  id               uuid primary key default uuid_generate_v4(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  news_flash_id    uuid references public.news_flashes(id) on delete set null,
  titulo           text not null,
  contenido        text not null,
  autor_id         uuid references public.members(id) on delete set null,
  is_published     boolean not null default true,
  sponsor_ids      uuid[] default '{}'
);

-- ─────────────────────────────────────────
-- TABLA: notas_medios (gacetillas de prensa)
-- ─────────────────────────────────────────
create table if not exists public.notas_medios (
  id               uuid primary key default uuid_generate_v4(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  news_flash_id    uuid references public.news_flashes(id) on delete set null,
  titulo           text not null,
  contenido        text not null,
  autor_id         uuid references public.members(id) on delete set null,
  is_published     boolean not null default true,
  contacto_prensa  jsonb default '{}'
);

-- ─────────────────────────────────────────
-- RLS para todas las tablas
-- ─────────────────────────────────────────
alter table public.notas_publico enable row level security;
alter table public.notas_miembros enable row level security;
alter table public.notas_sponsors enable row level security;
alter table public.notas_medios enable row level security;

-- ─────────────────────────────────────────
-- Políticas: notas_publico (lectura pública)
-- ─────────────────────────────────────────
create policy "notas_publico lectura pública"
  on public.notas_publico for select
  using (is_published = true);

create policy "notas_publico admins todo"
  on public.notas_publico for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
      and role in ('admin', 'coordinador')
      and status = 'activo'
    )
  );

-- ─────────────────────────────────────────
-- Políticas: notas_miembros (solo autenticados)
-- ─────────────────────────────────────────
create policy "notas_miembros lectura autenticados"
  on public.notas_miembros for select
  using (auth.role() = 'authenticated');

create policy "notas_miembros admins todo"
  on public.notas_miembros for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
      and role in ('admin', 'coordinador')
      and status = 'activo'
    )
  );

-- ─────────────────────────────────────────
-- Políticas: notas_sponsors (sponsors ven su contenido)
-- ─────────────────────────────────────────
create policy "notas_sponsors lectura sponsors"
  on public.notas_sponsors for select
  using (
    is_published = true
    and (
      exists (
        select 1 from public.sponsors
        where id = any(sponsor_ids)
        and private_token = auth.uid()
      )
      or exists (
        select 1 from public.members
        where id = auth.uid()
        and role in ('admin', 'coordinador')
        and status = 'activo'
      )
    )
  );

create policy "notas_sponsors admins todo"
  on public.notas_sponsors for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
      and role in ('admin', 'coordinador')
      and status = 'activo'
    )
  );

-- ─────────────────────────────────────────
-- Políticas: notas_medios (solo admins)
-- ─────────────────────────────────────────
create policy "notas_medios lectura autenticados"
  on public.notas_medios for select
  using (auth.role() = 'authenticated');

create policy "notas_medios admins todo"
  on public.notas_medios for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
      and role in ('admin', 'coordinador')
      and status = 'activo'
    )
  );

-- ─────────────────────────────────────────
-- Triggers updated_at
-- ─────────────────────────────────────────
drop trigger if exists set_updated_at on public.notas_publico;
create trigger set_updated_at before update on public.notas_publico
  for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at on public.notas_miembros;
create trigger set_updated_at before update on public.notas_miembros
  for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at on public.notas_sponsors;
create trigger set_updated_at before update on public.notas_sponsors
  for each row execute function public.handle_updated_at();

drop trigger if exists set_updated_at on public.notas_medios;
create trigger set_updated_at before update on public.notas_medios
  for each row execute function public.handle_updated_at();
