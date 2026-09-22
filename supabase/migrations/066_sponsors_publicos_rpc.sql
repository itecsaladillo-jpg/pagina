-- ============================================================
-- ITEC Augusto Cicaré - Migración 066: RPC público de sponsors
-- Expone solo campos seguros de sponsors activos para la
-- sección "NUESTROS SOCIOS" de la landing page.
-- ============================================================

DROP FUNCTION IF EXISTS public.obtener_sponsors_publicos();

create or replace function public.obtener_sponsors_publicos()
returns table (
  id uuid,
  name text,
  tier text,
  logo_color_url text,
  resena text,
  website_url text,
  email text
)
language plpgsql
security definer
as $$
begin
  return query
  select
    s.id,
    s.name,
    s.tier::text,
    s.logo_color_url,
    s.resena,
    s.website_url,
    s.email
  from public.sponsors s
  where s.is_active = true
    and s.name is not null
  order by s.created_at;
end;
$$;

-- Mantener permisos de ejecución (igual que obtener_miembros_publicos)
grant execute on function public.obtener_sponsors_publicos() to anon, authenticated, service_role;