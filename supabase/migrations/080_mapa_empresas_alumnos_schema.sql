-- ============================================================
-- ITEC Saladillo — Migración 080: Esquema y RLS para Mapa Productivo
-- (mapa_empresas y alumnos_talentos)
-- ============================================================

-- 1. TABLA mapa_empresas
CREATE TABLE IF NOT EXISTS public.mapa_empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  nombre TEXT,
  nombre_empresa TEXT,
  rubro TEXT,
  sector TEXT,
  email TEXT,
  telefono TEXT,
  oferta TEXT,
  descripcion_oferta TEXT,
  demanda TEXT[],
  descripcion_demanda TEXT,
  detalles_demanda TEXT,
  desafio_tecnologico TEXT,
  direccion TEXT,
  latitud NUMERIC,
  longitud NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Asegurar columnas necesarias en caso de que la tabla ya exista con esquema parcial
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS nombre TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS nombre_empresa TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS rubro TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS sector TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS oferta TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS descripcion_oferta TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS demanda TEXT[];
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS descripcion_demanda TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS detalles_demanda TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS desafio_tecnologico TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS latitud NUMERIC;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS longitud NUMERIC;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Función trigger para sincronizar campos equivalentes (asistente vs registro)
CREATE OR REPLACE FUNCTION public.sync_mapa_empresas_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Nombre
  IF NEW.nombre IS NOT NULL AND NEW.nombre_empresa IS NULL THEN
    NEW.nombre_empresa := NEW.nombre;
  ELSIF NEW.nombre_empresa IS NOT NULL AND NEW.nombre IS NULL THEN
    NEW.nombre := NEW.nombre_empresa;
  END IF;

  -- Rubro / Sector
  IF NEW.rubro IS NOT NULL AND NEW.sector IS NULL THEN
    NEW.sector := NEW.rubro;
  ELSIF NEW.sector IS NOT NULL AND NEW.rubro IS NULL THEN
    NEW.rubro := NEW.sector;
  END IF;

  -- Oferta / Descripción Oferta
  IF NEW.oferta IS NOT NULL AND NEW.descripcion_oferta IS NULL THEN
    NEW.descripcion_oferta := NEW.oferta;
  ELSIF NEW.descripcion_oferta IS NOT NULL AND NEW.oferta IS NULL THEN
    NEW.oferta := NEW.descripcion_oferta;
  END IF;

  -- Demanda / Descripción Demanda
  IF NEW.detalles_demanda IS NOT NULL AND NEW.descripcion_demanda IS NULL THEN
    NEW.descripcion_demanda := NEW.detalles_demanda;
  ELSIF NEW.descripcion_demanda IS NOT NULL AND NEW.detalles_demanda IS NULL THEN
    NEW.detalles_demanda := NEW.descripcion_demanda;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_mapa_empresas ON public.mapa_empresas;
CREATE TRIGGER trg_sync_mapa_empresas
  BEFORE INSERT OR UPDATE ON public.mapa_empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_mapa_empresas_fields();

-- Habilitar RLS en mapa_empresas
ALTER TABLE public.mapa_empresas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mapa_empresas_select_public" ON public.mapa_empresas;
CREATE POLICY "mapa_empresas_select_public"
  ON public.mapa_empresas FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "mapa_empresas_insert_anon" ON public.mapa_empresas;
CREATE POLICY "mapa_empresas_insert_anon"
  ON public.mapa_empresas FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 2. TABLA alumnos_talentos
CREATE TABLE IF NOT EXISTS public.alumnos_talentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  escuela TEXT NOT NULL,
  especialidad TEXT NOT NULL,
  habilidades TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.alumnos_talentos ADD COLUMN IF NOT EXISTS escuela TEXT;
ALTER TABLE public.alumnos_talentos ADD COLUMN IF NOT EXISTS especialidad TEXT;
ALTER TABLE public.alumnos_talentos ADD COLUMN IF NOT EXISTS habilidades TEXT[] DEFAULT '{}';
ALTER TABLE public.alumnos_talentos ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Habilitar RLS en alumnos_talentos
ALTER TABLE public.alumnos_talentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alumnos_talentos_select_public" ON public.alumnos_talentos;
CREATE POLICY "alumnos_talentos_select_public"
  ON public.alumnos_talentos FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "alumnos_talentos_insert_anon" ON public.alumnos_talentos;
CREATE POLICY "alumnos_talentos_insert_anon"
  ON public.alumnos_talentos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
