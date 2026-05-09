-- ─────────────────────────────────────────
-- TABLA: site_settings
-- ─────────────────────────────────────────
create table public.site_settings (
  id           uuid primary key default uuid_generate_v4(),
  updated_at   timestamptz not null default now(),
  hero_title   text not null default 'ITEC Augusto Cicaré',
  hero_subtitle text not null default 'Innovación, Tecnología y Educación para el Futuro',
  contact_email text,
  maintenance_mode boolean not null default false
);

alter table public.site_settings enable row level security;

create policy "Settings visibles para todos"
  on public.site_settings for select
  using (true);

create policy "Solo admins editan settings"
  on public.site_settings for update
  using (
    exists (
      select 1 from public.members
      where id = auth.uid() and role = 'admin'
    )
  );

-- Insertar configuración inicial
insert into public.site_settings (hero_title, hero_subtitle)
values ('ITEC Augusto Cicaré', 'Innovación, Tecnología y Educación para el Futuro');
