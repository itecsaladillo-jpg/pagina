-- Bucket para documentos de entrenamiento del asistente
insert into storage.buckets (id, name, public)
values ('training-docs', 'training-docs', true)
on conflict (id) do nothing;

-- Lectura pública
create policy "Training docs son públicos para lectura"
on storage.objects for select
using ( bucket_id = 'training-docs' );

-- Solo admins pueden subir
create policy "Solo admins suben training docs"
on storage.objects for insert
with check (
  bucket_id = 'training-docs' AND
  exists (
    select 1 from public.members
    where id = auth.uid()
      and role = 'admin'
  )
);

-- Solo admins pueden borrar
create policy "Solo admins borran training docs"
on storage.objects for delete
using (
  bucket_id = 'training-docs' AND
  exists (
    select 1 from public.members
    where id = auth.uid()
      and role = 'admin'
  )
);
