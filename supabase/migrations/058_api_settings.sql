-- ─────────────────────────────────────────
-- TABLA: api_settings (key/value para API keys)
-- ─────────────────────────────────────────
create table if not exists public.api_settings (
  id         uuid primary key default uuid_generate_v4(),
  key        text not null unique,
  value      text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.api_settings enable row level security;

drop policy if exists "api_settings select admin" on public.api_settings;
create policy "api_settings select admin"
  on public.api_settings for select
  using (
    exists (
      select 1 from public.members
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "api_settings insert admin" on public.api_settings;
create policy "api_settings insert admin"
  on public.api_settings for insert
  with check (
    exists (
      select 1 from public.members
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "api_settings update admin" on public.api_settings;
create policy "api_settings update admin"
  on public.api_settings for update
  using (
    exists (
      select 1 from public.members
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "api_settings delete admin" on public.api_settings;
create policy "api_settings delete admin"
  on public.api_settings for delete
  using (
    exists (
      select 1 from public.members
      where id = auth.uid() and role = 'admin'
    )
  );

-- Índice para búsquedas por key
create index if not exists idx_api_settings_key on public.api_settings (key);
