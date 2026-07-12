-- ============================================================
-- ITEC Augusto Cicaré - Migración 036: Campos adicionales sponsors
-- ============================================================

-- Agregar campos faltantes a tabla sponsors existente
alter table public.sponsors
  add column if not exists nombre_empresa text,
  add column if not exists actividad text,
  add column if not exists zona_influencia text,
  add column if not exists nombre_contacto text,
  add column if not exists apellido_contacto text,
  add column if not exists telefono text,
  add column if not exists email text unique;

-- RLS actualizada: solo admins pueden acceder totalmente a sponsors
drop policy if exists "Sponsors visibles para admins" on public.sponsors;
drop policy if exists "Solo admins pueden crear/editar sponsors" on public.sponsors;

-- Política: solo admins pueden leer todos los sponsors
create policy "Solo admins leen sponsors"
  on public.sponsors for select
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
        and role = 'admin'
        and status = 'activo'
    )
  );

-- Política: solo admins pueden insertar/editar sponsors
create policy "Solo admins crean/editan sponsors"
  on public.sponsors for all
  with check (
    exists (
      select 1 from public.members
      where id = auth.uid()
        and role = 'admin'
        and status = 'activo'
    )
  );
