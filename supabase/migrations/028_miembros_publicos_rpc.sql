-- ============================================================
-- ITEC Augusto Cicaré - Migración 028: RPC para Directorio Público de Miembros
-- ============================================================

create or replace function public.obtener_miembros_publicos()
returns table (
  full_name text,
  role text,
  frase_itec text,
  tareas_itec text,
  bio text
)
language plpgsql
security definer -- Corre con privilegios de administrador para saltar RLS de forma segura
as $$
begin
  return query
  select
    m.full_name,
    m.role,
    m.frase_itec,
    m.tareas_itec,
    m.bio
  from public.members m
  where m.status = 'activo'
    and m.full_name is not null;
end;
$$;

-- Otorgar permisos de ejecución explícitos a todos los roles
grant execute on function public.obtener_miembros_publicos() to anon, authenticated, service_role;
