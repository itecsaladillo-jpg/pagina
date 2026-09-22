-- Crear bucket si no existe
insert into storage.buckets (id, name, public)
values ('training-docs', 'training-docs', true)
on conflict (id) do nothing;

-- Políticas con IF NOT EXISTS para evitar conflictos
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'objects' 
    and policyname = 'Training docs son públicos para lectura'
    and schemaname = 'storage'
  ) then
    create policy "Training docs son públicos para lectura"
      on storage.objects for select
      using ( bucket_id = 'training-docs' );
  end if;

  if not exists (
    select 1 from pg_policies 
    where tablename = 'objects' 
    and policyname = 'Solo admins suben training docs'
    and schemaname = 'storage'
  ) then
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
  end if;

  if not exists (
    select 1 from pg_policies 
    where tablename = 'objects' 
    and policyname = 'Solo admins borran training docs'
    and schemaname = 'storage'
  ) then
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
  end if;
end $$;
