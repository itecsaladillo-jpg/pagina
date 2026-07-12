-- ============================================================
-- ITEC Augusto Cicaré - Migración 034: News multicanal (corrección)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- TABLA: news_sponsors - agregar updated_at
alter table public.news_sponsors
  add column if not exists updated_at timestamptz;

create trigger if not exists set_updated_at_news_sponsors
  before update on public.news_sponsors
  for each row execute function public.handle_updated_at();

-- RLS: Políticas actualizadas para news_flashes
drop policy if exists "Noticias públicas visibles sin auth" on public.news_flashes;
drop policy if exists "Noticias para miembros autenticados" on public.news_flashes;

-- Lectura pública: solo texto_publico (sin auth)
create policy "Lectura pública texto_publico"
  on public.news_flashes for select
  using (
    para_publico = true
    and texto_publico is not null
  );

-- Lectura protegida: texto_miembros para usuarios autenticados
create policy "Lectura miembros texto_miembros"
  on public.news_flashes for select
  using (
    auth.role() = 'authenticated'
    and para_miembros = true
  );

-- Admins/coordinadores acceden a todo
create policy "Admins coordinadores acceso completo"
  on public.news_flashes for select
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
      and role in ('admin', 'coordinador')
      and status = 'activo'
    )
  );

-- ÍNDICES para optimización
create index if not exists idx_news_flashes_para_publico on public.news_flashes(para_publico) where para_publico = true;
create index if not exists idx_news_flashes_para_miembros on public.news_flashes(para_miembros) where para_miembros = true;
create index if not exists idx_news_flashes_para_sponsors on public.news_flashes(para_sponsors) where para_sponsors = true;
create index if not exists idx_news_flashes_para_medios on public.news_flashes(para_medios) where para_medios = true;
create index if not exists idx_news_sponsors_news_flash_id on public.news_sponsors(news_flash_id);