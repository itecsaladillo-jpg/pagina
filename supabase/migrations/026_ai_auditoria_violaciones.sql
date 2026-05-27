-- Crear la tabla ai_auditoria_violaciones para monitoreo en tiempo real
create table public.ai_auditoria_violaciones (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  mensaje_usuario text not null,
  respuesta_ia text not null,
  regla_violada varchar(255) not null,
  nivel_gravedad text not null check (nivel_gravedad in ('bajo', 'medio', 'alto')),
  created_at timestamptz not null default now()
);

-- Habilitar RLS (Row Level Security)
alter table public.ai_auditoria_violaciones enable row level security;

-- Política de inserción: permitir inserción pública para auditoría desde el backend público
create policy "Permitir inserción pública de violaciones de IA"
  on public.ai_auditoria_violaciones for insert
  with check (true);

-- Política de lectura: lectura únicamente a miembros de la organización con privilegios de administrador
create policy "Solo administradores pueden ver violaciones de IA"
  on public.ai_auditoria_violaciones for select
  using (
    exists (
      select 1 from public.members
      where id = auth.uid() and role = 'admin'
    )
  );
