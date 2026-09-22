-- ============================================================
-- ITEC Augusto Cicaré - Migración 003: Feed de Noticias / Flashes
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- ─────────────────────────────────────────
-- TABLA: news_flashes (Feed de noticias generado por IA)
-- ─────────────────────────────────────────

create table public.news_flashes (
  id             uuid primary key default uuid_generate_v4(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  commission_id  uuid references public.commissions(id) on delete set null,
  author_id      uuid references public.members(id) on delete set null,

  -- Contenido original (transcripción o descripción)
  original_text  text not null,

  -- Salida generada por IA
  summary        text not null,          -- Resumen ejecutivo
  action_items   jsonb not null default '[]',  -- Lista de tareas pendientes
  flash_text     text not null,          -- Flash informativo para el muro

  -- Metadatos
  source_type    text not null default 'manual'
                   check (source_type in ('meet', 'capacitacion', 'reunion', 'manual')),
  title          text not null,
  is_published   boolean not null default true,
  tags           text[] not null default '{}'
);

alter table public.news_flashes enable row level security;

-- Noticias publicadas visibles para todos los autenticados
create policy "Noticias visibles para miembros activos"
  on public.news_flashes for select
  using (
    auth.role() = 'authenticated'
    and is_published = true
  );

-- Solo admins y coordinadores pueden crear noticias
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

-- Trigger updated_at
create trigger set_updated_at before update on public.news_flashes
  for each row execute function public.handle_updated_at();
