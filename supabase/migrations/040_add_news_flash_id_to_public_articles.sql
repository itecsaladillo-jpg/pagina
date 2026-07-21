-- ============================================================
-- ITEC Augusto Cicaré - Migración 040: Link public_articles to news_flashes
-- Agregar news_flash_id a public_articles para poder actualizar
-- el artículo cuando se edita la nota multicanal
-- ============================================================

alter table public.public_articles
  add column if not exists news_flash_id uuid references public.news_flashes(id) on delete set null;

create index if not exists idx_public_articles_news_flash_id
  on public.public_articles(news_flash_id);

-- Poblar news_flash_id para artículos existentes que se puedan vincular
-- mediante el slug (comparten el mismo slug con notas_publico)
update public.public_articles pa
  set news_flash_id = np.news_flash_id
  from public.notas_publico np
  where pa.slug = np.slug
    and pa.news_flash_id is null
    and np.news_flash_id is not null;
