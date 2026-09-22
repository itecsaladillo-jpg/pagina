-- Migración 068: Clasificación de socios en 3 categorías
-- Agrega columna type a sponsors y crea RPCs unificadas para la landing

-- 1. Agregar columna type a la tabla sponsors
ALTER TABLE public.sponsors ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'SPONSOR';

-- 2. Comentar la columna para documentación
COMMENT ON COLUMN public.sponsors.type IS 'Clasificación del socio: SPONSOR (patrocinador), STRATEGIC_ALLIANCE (aliado estratégico), DIFFUSION_CHANNEL (canal de difusión)';

-- 3. Crear índice para la nueva columna
CREATE INDEX IF NOT EXISTS idx_sponsors_type ON public.sponsors(type);

-- 4. Actualizar los sponsors existentes con tipo por defecto (solo los que no tienen type definido)
UPDATE public.sponsors SET type = 'SPONSOR' WHERE type IS NULL OR type = '';

-- 5. Eliminar la función anterior si existe
DROP FUNCTION IF EXISTS public.obtener_socios_publicos();

-- 6. Crear nueva RPC unificada que retorna los 3 tipos de socios
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
  actions_description text
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
    NULL::text as actions_description
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
    sp.actions_description
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
    NULL::text as actions_description
  FROM public.medios_prensa mp
  WHERE mp.nombre_medio IS NOT NULL

  ORDER BY type, name;
END;
$$;

-- 7. Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.obtener_socios_publicos() TO anon, authenticated, service_role;

-- 8. Mantener la función anterior por compatibilidad (deprecated)
-- DROP FUNCTION IF EXISTS public.obtener_sponsors_publicos();