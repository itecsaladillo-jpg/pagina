-- ============================================================
-- ITEC Augusto Cicaré - Migración 035: Comments for news_flashes
-- ============================================================

-- TABLA: news_comments (comentarios para Muro Interno)
create table if not exists public.news_comments (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  news_flash_id uuid not null references public.news_flashes(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  member_name text not null,
  member_email text not null,
  content text not null,
  is_deleted boolean not null default false
);

-- Índice para consultas rápidas por noticia
create index if not exists idx_news_comments_news_flash_id on public.news_comments(news_flash_id) where is_deleted = false;

-- Índice para obtener comentarios recientes
create index if not exists idx_news_comments_created_at on public.news_comments(created_at desc);

-- RLS: Solo miembros autenticados pueden comentar
alter table public.news_comments enable row level security;

-- Miembros pueden crear comentarios
create policy if not exists "Miembros crean comentarios"
  on public.news_comments for insert
  with check (
    exists (
      select 1 from public.members
      where id = auth.uid()
      and status = 'activo'
    )
    and member_email = (
      select email from public.members where id = auth.uid()
    )
  );

-- Miembros ven comentarios de noticias donde para_miembros = true
create policy if not exists "Miembros ven comentarios de noticias internas"
  on public.news_comments for select
  using (
    exists (
      select 1 from public.news_flashes
      where id = news_flash_id
      and para_miembros = true
    )
  );

-- Admins pueden gestionar comentarios
create policy if not exists "Admins gestionan comentarios"
  on public.news_comments for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
      and role = 'admin'
      and status = 'activo'
    )
  );
