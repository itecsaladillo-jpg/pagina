-- Migración 069: Expandir RPC obtener_socios_publicos con todos los campos disponibles
-- Agrega rubro, description, contacto_nombre, contacto_telefono, actividad,
-- zona_influencia, telefono (sponsors) y nombre_contacto, apellido_contacto,
-- telefono, dial_radio, zona_influencia (medios_prensa)

DROP FUNCTION IF EXISTS public.obtener_socios_publicos();

CREATE OR REPLACE FUNCTION public.obtener_socios_publicos()
RETURNS TABLE (
  id uuid,
  name text,
  type text,
  tier text,
  logo_color_url text,
  logo_url text,
  resena text,
  website_url text,
  email text,
  category text,
  actions_description text,
  -- Sponsors extras
  rubro text,
  description text,
  contacto_nombre text,
  contacto_telefono text,
  actividad text,
  zona_influencia text,
  telefono text,
  -- Medios de prensa extras
  nombre_contacto text,
  apellido_contacto text,
  dial_radio text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Retornar sponsors (patrocinadores)
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.type,
    s.tier::text,
    s.logo_color_url,
    s.logo_color_url as logo_url,
    s.resena,
    s.website_url,
    s.email,
    NULL::text as category,
    NULL::text as actions_description,
    s.rubro,
    s.description,
    s.contacto_nombre,
    s.contacto_telefono,
    s.actividad,
    s.zona_influencia,
    s.telefono,
    NULL::text as nombre_contacto,
    NULL::text as apellido_contacto,
    NULL::text as dial_radio
  FROM public.sponsors s
  WHERE s.is_active = true
    AND s.name IS NOT NULL
    AND s.type = 'SPONSOR'

  UNION ALL

  -- Retornar alianzas estratégicas
  SELECT
    sp.id,
    sp.name,
    'STRATEGIC_ALLIANCE'::text as type,
    NULL::text as tier,
    NULL::text as logo_color_url,
    sp.logo_url,
    NULL::text as resena,
    NULL::text as website_url,
    NULL::text as email,
    sp.category,
    sp.actions_description,
    NULL::text as rubro,
    NULL::text as description,
    NULL::text as contacto_nombre,
    NULL::text as contacto_telefono,
    NULL::text as actividad,
    NULL::text as zona_influencia,
    NULL::text as telefono,
    NULL::text as nombre_contacto,
    NULL::text as apellido_contacto,
    NULL::text as dial_radio
  FROM public.strategic_partners sp
  WHERE sp.is_active = true

  UNION ALL

  -- Retornar canales de difusión (medios de prensa)
  SELECT
    mp.id,
    mp.nombre_medio as name,
    'DIFFUSION_CHANNEL'::text as type,
    NULL::text as tier,
    NULL::text as logo_color_url,
    NULL::text as logo_url,
    NULL::text as resena,
    mp.url_web as website_url,
    mp.email,
    mp.tipo_medio as category,
    NULL::text as actions_description,
    NULL::text as rubro,
    NULL::text as description,
    NULL::text as contacto_nombre,
    NULL::text as contacto_telefono,
    NULL::text as actividad,
    mp.zona_influencia,
    mp.telefono,
    mp.nombre_contacto,
    mp.apellido_contacto,
    mp.dial_radio
  FROM public.medios_prensa mp
  WHERE mp.nombre_medio IS NOT NULL

  ORDER BY type, name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.obtener_socios_publicos() TO anon, authenticated, service_role;
