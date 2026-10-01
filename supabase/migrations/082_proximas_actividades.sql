-- ============================================================
-- ITEC Augusto Cicaré - Migración 082: Pizarra de Próximas Actividades
-- ============================================================

create table if not exists public.proximas_actividades (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  titulo      text not null,
  lugar       text not null,
  fecha       timestamptz not null,
  is_active   boolean not null default true
);

alter table public.proximas_actividades enable row level security;

-- 1. Visibilidad Pública: Cualquiera puede ver las actividades activas
drop policy if exists "Proximas actividades publicas" on public.proximas_actividades;
create policy "Proximas actividades publicas"
  on public.proximas_actividades for select
  using (is_active = true);

-- 2. Gestión para Administradores y Coordinadores
drop policy if exists "Staff activo gestiona proximas actividades" on public.proximas_actividades;
create policy "Staff activo gestiona proximas actividades"
  on public.proximas_actividades for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
        and role in ('admin', 'coordinador')
        and status = 'activo'
    )
  );

-- Trigger para updated_at automático
drop trigger if exists set_updated_at on public.proximas_actividades;
create trigger set_updated_at before update on public.proximas_actividades
  for each row execute function public.handle_updated_at();
