-- ============================================================
-- ITEC Augusto Cicaré - Migración 006: Artículos Públicos
-- ============================================================

create table if not exists public.public_articles (
  id           uuid primary key default uuid_generate_v4(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  title        text not null,
  content      text not null,
  media_urls   text[] not null default '{}',
  author_id    uuid references public.members(id) on delete set null,
  is_published boolean not null default false,
  slug         text unique not null,
  excerpt      text
);

-- RLS
alter table public.public_articles enable row level security;

-- Los artículos publicados son visibles para todos (incluso anónimos)
create policy "Artículos publicados son visibles para todos"
  on public.public_articles for select
  using (is_published = true);

-- Solo admins pueden gestionar artículos
create policy "Solo admins gestionan artículos"
  on public.public_articles for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
        and role = 'admin'
    )
  );

-- Trigger para updated_at
create trigger set_updated_at before update on public.public_articles
  for each row execute function public.handle_updated_at();
