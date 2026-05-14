-- ============================================================
-- Pre-aprobación de miembros por Email
-- ============================================================

create table if not exists public.allowed_emails (
  email text primary key,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

-- RLS para allowed_emails
alter table public.allowed_emails enable row level security;

create policy "Admins pueden gestionar correos permitidos"
  on public.allowed_emails for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid() and role = 'admin'
    )
  );

-- Actualizar el trigger handle_new_user para que auto-apruebe si el mail está permitido
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  is_allowed boolean;
begin
  -- Verificar si el email está pre-aprobado
  select exists(select 1 from public.allowed_emails where email = new.email) into is_allowed;

  insert into public.members (id, email, full_name, avatar_url, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    case when is_allowed then 'activo' else 'pendiente' end
  );

  -- Si estaba en allowed_emails, lo borramos (opcional, para limpiar)
  -- delete from public.allowed_emails where email = new.email;

  return new;
end;
$$;
