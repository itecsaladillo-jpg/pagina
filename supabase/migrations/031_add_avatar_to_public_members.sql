-- ============================================================
-- ITEC Augusto Cicaré - Migración 031: RPC para Directorio Público de Miembros (Actualizado)
-- ============================================================

-- Reemplazamos la función existente para añadir el avatar_url y otros campos útiles.
-- NOTA: Como cambia la firma de retorno, debemos eliminar la anterior primero.
DROP FUNCTION IF EXISTS public.obtener_miembros_publicos();

create or replace function public.obtener_miembros_publicos()
returns table (
  id uuid,
  full_name text,
  email text,
  role text,
  avatar_url text,
  frase_itec text,
  tareas_itec text,
  bio text,
  phone text
)
language plpgsql
security definer -- Corre con privilegios de administrador para saltar RLS de forma segura
as $$
begin
  return query
  select
    m.id,
    m.full_name,
    m.email,
    m.role,
    m.avatar_url,
    m.frase_itec,
    m.tareas_itec,
    m.bio,
    m.phone
  from public.members m
  where m.status = 'activo'
    and m.full_name is not null;
end;
$$;

-- Otorgar permisos de ejecución explícitos a todos los roles
grant execute on function public.obtener_miembros_publicos() to anon, authenticated, service_role;
