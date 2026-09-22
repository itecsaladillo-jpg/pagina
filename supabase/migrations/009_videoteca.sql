-- ============================================================
-- ITEC Augusto Cicaré - Migración 009: Videoteca
-- ============================================================

-- 1. Crear la tabla de videos
create table if not exists public.videos (
  id               uuid primary key default uuid_generate_v4(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  title            text not null,
  description      text,
  youtube_url      text not null,
  thumbnail_url    text, -- Opcional, se puede autogenerar desde la URL de YouTube
  display_order    integer default 0,
  is_active        boolean default true
);

-- 2. Seguridad (RLS)
alter table public.videos enable row level security;

-- Visibilidad Pública (Todos pueden ver los videos activos)
create policy "Videos visibles para todos"
  on public.videos for select
  using (is_active = true);

-- Gestión total para administradores/coordinadores
create policy "Gestión total de videos para staff activo"
  on public.videos for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
        and role in ('admin', 'coordinador')
        and status = 'activo'
    )
  );

-- 3. Trigger updated_at
create trigger set_updated_at before update on public.videos
  for each row execute function public.handle_updated_at();
