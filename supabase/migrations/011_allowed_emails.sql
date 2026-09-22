-- ============================================================
-- Pre-aprobación de miembros por Email (Con soporte de Roles)
-- ============================================================

create table if not exists public.allowed_emails (
  email text primary key,
  role text not null default 'miembro' check (role in ('admin','coordinador','miembro','colaborador')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

-- Asegurar que la columna role exista si la tabla ya fue creada
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='allowed_emails' and column_name='role') then
    alter table public.allowed_emails add column role text not null default 'miembro' check (role in ('admin','coordinador','miembro','colaborador'));
  end if;
end $$;

-- RLS para allowed_emails
alter table public.allowed_emails enable row level security;

drop policy if exists "Admins pueden gestionar correos permitidos" on public.allowed_emails;

create policy "Admins pueden gestionar correos permitidos"
  on public.allowed_emails for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid() and role = 'admin'
    )
  );

-- Actualizar el trigger handle_new_user para que auto-apruebe y use el rol predefinido
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  pre_role text;
begin
  -- Verificar si el email está pre-aprobado y obtener su rol
  select role from public.allowed_emails where email = new.email into pre_role;

  insert into public.members (id, email, full_name, avatar_url, status, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name', 
      new.raw_user_meta_data->>'name', 
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    case when pre_role is not null then 'activo' else 'pendiente' end,
    coalesce(pre_role, 'miembro')
  );

  return new;
end;
$$;
