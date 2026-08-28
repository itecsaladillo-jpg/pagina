-- ============================================================
-- Fix: Hacer que el trigger handle_new_user sea case-insensitive
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  pre_role text;
  pre_name text;
  pre_phone text;
  pre_comm uuid;
begin
  -- Obtener todos los datos de la pre-aprobación, comparando en minúsculas
  select role, full_name, phone, commission_id 
  from public.allowed_emails 
  where lower(email) = lower(new.email) 
  into pre_role, pre_name, pre_phone, pre_comm;

  insert into public.members (id, email, full_name, avatar_url, status, role, phone)
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
    coalesce(pre_role, 'miembro'),
    pre_phone
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
