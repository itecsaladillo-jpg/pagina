-- ============================================================
-- ITEC Augusto Cicaré - Migración 027: Almacenamiento de Avatars
-- ============================================================

-- Crear bucket para avatars si no existe
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Políticas de Seguridad para el bucket 'avatars'

-- 1. Acceso público para lectura de avatars
create policy "Avatars son públicos para lectura"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- 2. Permitir a miembros autenticados subir sus propios avatars
create policy "Miembros pueden subir sus propios avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars' AND
  exists (
    select 1 from public.members
    where id = auth.uid()
  )
);

-- 3. Permitir a miembros actualizar sus propios avatars
create policy "Miembros pueden actualizar sus propios avatars"
on storage.objects for update
using (
  bucket_id = 'avatars' AND
  exists (
    select 1 from public.members
    where id = auth.uid()
  )
);

-- 4. Permitir a miembros borrar sus propios avatars
create policy "Miembros pueden borrar sus propios avatars"
on storage.objects for delete
using (
  bucket_id = 'avatars' AND
  exists (
    select 1 from public.members
    where id = auth.uid()
  )
);
