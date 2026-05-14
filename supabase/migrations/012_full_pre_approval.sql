-- ============================================================
-- Pre-aprobación de miembros Completa (Sin necesidad de registro previo)
-- ============================================================

-- Agregar columnas a allowed_emails para capturar datos adicionales
alter table public.allowed_emails 
add column if not exists full_name text,
add column if not exists commission_id uuid references public.commissions(id) on delete set null;

-- Actualizar el trigger handle_new_user para migrar TODO al momento del registro real
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  pre_role text;
  pre_name text;
  pre_comm uuid;
begin
  -- Obtener todos los datos de la pre-aprobación
  select role, full_name, commission_id 
  from public.allowed_emails 
  where email = new.email 
  into pre_role, pre_name, pre_comm;

  insert into public.members (id, email, full_name, avatar_url, status, role)
  values (
    new.id,
    new.email,
    coalesce(
      pre_name,
      new.raw_user_meta_data->>'full_name', 
      new.raw_user_meta_data->>'name', 
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    case when pre_role is not null then 'activo' else 'pendiente' end,
    coalesce(pre_role, 'miembro')
  );

  -- Si tenía comisión pre-asignada, la vinculamos
  if pre_comm is not null then
    insert into public.commission_members (commission_id, member_id)
    values (pre_comm, new.id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;
