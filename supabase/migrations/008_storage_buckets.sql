-- ============================================================
-- ITEC Augusto Cicaré - Migración 008: Almacenamiento
-- ============================================================

-- Crear bucket para medios de artículos si no existe
insert into storage.buckets (id, name, public)
values ('article-media', 'article-media', true)
on conflict (id) do nothing;

-- Políticas de Seguridad para el bucket

-- 1. Acceso público para lectura
create policy "Medios de artículos son públicos para lectura"
on storage.objects for select
using ( bucket_id = 'article-media' );

-- 2. Solo admins pueden subir archivos
create policy "Solo admins suben medios"
on storage.objects for insert
with check (
  bucket_id = 'article-media' AND
  exists (
    select 1 from public.members
    where id = auth.uid()
      and role = 'admin'
  )
);

-- 3. Solo admins pueden borrar archivos
create policy "Solo admins borran medios"
on storage.objects for delete
using (
  bucket_id = 'article-media' AND
  exists (
    select 1 from public.members
    where id = auth.uid()
      and role = 'admin'
  )
);
