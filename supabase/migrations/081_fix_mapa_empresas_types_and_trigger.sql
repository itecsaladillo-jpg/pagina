-- ============================================================
-- ITEC Saladillo — Migración 081: Corrección de tipos y trigger en mapa_empresas
-- Previene error 22P02 (malformed array literal) al sincronizar campos y garantiza compatibilidad total
-- ============================================================

-- 1. Asegurar que las columnas descriptivas sean de tipo TEXT plano (no TEXT[])
DO $$
BEGIN
  -- nombre
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mapa_empresas' AND column_name = 'nombre' AND data_type = 'ARRAY') THEN
    ALTER TABLE public.mapa_empresas ALTER COLUMN nombre TYPE TEXT USING array_to_string(nombre, ', ');
  END IF;

  -- nombre_empresa
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mapa_empresas' AND column_name = 'nombre_empresa' AND data_type = 'ARRAY') THEN
    ALTER TABLE public.mapa_empresas ALTER COLUMN nombre_empresa TYPE TEXT USING array_to_string(nombre_empresa, ', ');
  END IF;

  -- rubro
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mapa_empresas' AND column_name = 'rubro' AND data_type = 'ARRAY') THEN
    ALTER TABLE public.mapa_empresas ALTER COLUMN rubro TYPE TEXT USING array_to_string(rubro, ', ');
  END IF;

  -- sector
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mapa_empresas' AND column_name = 'sector' AND data_type = 'ARRAY') THEN
    ALTER TABLE public.mapa_empresas ALTER COLUMN sector TYPE TEXT USING array_to_string(sector, ', ');
  END IF;

  -- oferta
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mapa_empresas' AND column_name = 'oferta' AND data_type = 'ARRAY') THEN
    ALTER TABLE public.mapa_empresas ALTER COLUMN oferta TYPE TEXT USING array_to_string(oferta, ', ');
  END IF;

  -- descripcion_oferta
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mapa_empresas' AND column_name = 'descripcion_oferta' AND data_type = 'ARRAY') THEN
    ALTER TABLE public.mapa_empresas ALTER COLUMN descripcion_oferta TYPE TEXT USING array_to_string(descripcion_oferta, ', ');
  END IF;

  -- detalles_demanda
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mapa_empresas' AND column_name = 'detalles_demanda' AND data_type = 'ARRAY') THEN
    ALTER TABLE public.mapa_empresas ALTER COLUMN detalles_demanda TYPE TEXT USING array_to_string(detalles_demanda, ', ');
  END IF;

  -- descripcion_demanda
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mapa_empresas' AND column_name = 'descripcion_demanda' AND data_type = 'ARRAY') THEN
    ALTER TABLE public.mapa_empresas ALTER COLUMN descripcion_demanda TYPE TEXT USING array_to_string(descripcion_demanda, ', ');
  END IF;

  -- desafio_tecnologico
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mapa_empresas' AND column_name = 'desafio_tecnologico' AND data_type = 'ARRAY') THEN
    ALTER TABLE public.mapa_empresas ALTER COLUMN desafio_tecnologico TYPE TEXT USING array_to_string(desafio_tecnologico, ', ');
  END IF;
END $$;

-- Asegurar columnas si faltasen
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS nombre TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS nombre_empresa TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS rubro TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS sector TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS oferta TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS descripcion_oferta TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS descripcion_demanda TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS detalles_demanda TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS desafio_tecnologico TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS latitud NUMERIC;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS longitud NUMERIC;
ALTER TABLE public.mapa_empresas ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Asegurar que 'demanda' sea TEXT[] con DEFAULT '{}'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'mapa_empresas' 
      AND column_name = 'demanda'
  ) THEN
    ALTER TABLE public.mapa_empresas ADD COLUMN demanda TEXT[] DEFAULT '{}';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'mapa_empresas' 
      AND column_name = 'demanda' 
      AND data_type = 'text'
  ) THEN
    ALTER TABLE public.mapa_empresas ALTER COLUMN demanda TYPE TEXT[] USING string_to_array(demanda, ',');
    ALTER TABLE public.mapa_empresas ALTER COLUMN demanda SET DEFAULT '{}';
  END IF;
END $$;

-- 3. Trigger robusto y seguro: NUNCA asigna tipos incompatibles sin conversión explícita
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

  -- Demanda / Descripción Demanda (ambos campos de tipo TEXT)
  IF NEW.detalles_demanda IS NOT NULL AND NEW.descripcion_demanda IS NULL THEN
    NEW.descripcion_demanda := NEW.detalles_demanda;
  ELSIF NEW.descripcion_demanda IS NOT NULL AND NEW.detalles_demanda IS NULL THEN
    NEW.detalles_demanda := NEW.descripcion_demanda;
  END IF;

  -- Sincronizar 'demanda' (TEXT[]) con 'detalles_demanda' (TEXT) de forma 100% segura usando ARRAY[...]
  IF (NEW.demanda IS NULL OR cardinality(NEW.demanda) = 0) AND NEW.detalles_demanda IS NOT NULL AND trim(NEW.detalles_demanda) <> '' THEN
    NEW.demanda := ARRAY[trim(NEW.detalles_demanda)];
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_mapa_empresas ON public.mapa_empresas;
CREATE TRIGGER trg_sync_mapa_empresas
  BEFORE INSERT OR UPDATE ON public.mapa_empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_mapa_empresas_fields();
