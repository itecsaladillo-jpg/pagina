-- ─────────────────────────────────────────────────────────────
-- MIGRACIÓN DE SUPABASE: AULAS VIRTUALES Y CERTIFICADOS DIGITALES
-- Ubicación: supabase/migrations/024_clases_y_certificados.sql
-- ─────────────────────────────────────────────────────────────

-- 1. Tabla de Clases Virtuales (Aulas)
CREATE TABLE IF NOT EXISTS public.clases_virtuales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    url_stream TEXT NOT NULL,
    estado_sidebar TEXT NOT NULL DEFAULT 'chat' CHECK (estado_sidebar IN ('chat', 'modometro')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla de Interacciones de la Clase (Mensajes, Modómetro y Pedido de Palabra)
CREATE TABLE IF NOT EXISTS public.clase_interacciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clase_id UUID REFERENCES public.clases_virtuales(id) ON DELETE CASCADE,
    alumno_nombre TEXT NOT NULL,
    alumno_email TEXT NOT NULL,
    pide_palabra BOOLEAN NOT NULL DEFAULT FALSE,
    duda_texto TEXT,
    modometro_voto TEXT CHECK (modometro_voto IN ('bien', 'perdido', 'rapido')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Constraint de unicidad para permitir UPSERT en caliente por alumno por clase
    CONSTRAINT unique_clase_alumno UNIQUE (clase_id, alumno_email)
);

-- 3. Tabla de Certificados Digitales (Pasaporte de Habilidades)
CREATE TABLE IF NOT EXISTS public.certificados_digitales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL UNIQUE,
    alumno_nombre TEXT NOT NULL,
    capacitacion_nombre TEXT NOT NULL,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    habilidades TEXT[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ─────────────────────────────────────────────────────────────

-- Habilitar Row Level Security (RLS) en todas las tablas
ALTER TABLE public.clases_virtuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clase_interacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificados_digitales ENABLE ROW LEVEL SECURITY;

-- Políticas para clases_virtuales
CREATE POLICY "Lectura pública de clases virtuales"
ON public.clases_virtuales
FOR SELECT
USING (true);

CREATE POLICY "Administración total de clases virtuales para administradores"
ON public.clases_virtuales
FOR ALL
USING (true) -- En desarrollo local permitimos administración total para pruebas fluidas
WITH CHECK (true);

-- Políticas para clase_interacciones
CREATE POLICY "Lectura pública de interacciones de clase"
ON public.clase_interacciones
FOR SELECT
USING (true);

CREATE POLICY "Estudiantes pueden insertar/actualizar sus interacciones (UPSERT)"
ON public.clase_interacciones
FOR ALL
USING (true)
WITH CHECK (true);

-- Políticas para certificados_digitales
CREATE POLICY "Lectura pública de certificados mediante código de verificación"
ON public.certificados_digitales
FOR SELECT
USING (true);

CREATE POLICY "Administración total de certificados para administradores"
ON public.certificados_digitales
FOR ALL
USING (true)
WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- REGISTRO EN SUPABASE REALTIME
-- ─────────────────────────────────────────────────────────────

-- Añadir tablas a la publicación de tiempo real de Supabase
BEGIN;
  -- Remover si ya existían para evitar colisiones
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.clases_virtuales;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.clase_interacciones;
  
  -- Añadir a la publicación para escuchar inserciones, actualizaciones y borrados
  ALTER PUBLICATION supabase_realtime ADD TABLE public.clases_virtuales;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.clase_interacciones;
COMMIT;
