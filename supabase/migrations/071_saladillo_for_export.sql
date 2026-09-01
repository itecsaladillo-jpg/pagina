-- ============================================================
-- Migración 071: Tabla Saladillo for Export
-- ============================================================

-- Tabla principal
CREATE TABLE IF NOT EXISTS public.saladillo_for_export (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  foto_url TEXT NOT NULL,
  ciudad_residencia TEXT NOT NULL,
  pais_residencia TEXT NOT NULL,
  escuela_origen TEXT NOT NULL,
  profesion_rol TEXT NOT NULL,
  mensaje_gratitud TEXT NOT NULL,
  es_embajador BOOLEAN NOT NULL DEFAULT false,
  orden_embajador INTEGER CHECK (orden_embajador BETWEEN 1 AND 4),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_saladillo_export_estado ON public.saladillo_for_export (estado);
CREATE INDEX IF NOT EXISTS idx_saladillo_export_embajador ON public.saladillo_for_export (es_embajador, orden_embajador);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.saladillo_for_export ENABLE ROW LEVEL SECURITY;

-- Lectura pública solo para registros aprobados
CREATE POLICY "Leer testimonios aprobados"
  ON public.saladillo_for_export
  FOR SELECT
  USING (estado = 'aprobado');

-- Inserción pública permitida (estado por defecto 'pendiente')
CREATE POLICY "Permitir crear testimonios"
  ON public.saladillo_for_export
  FOR INSERT
  WITH CHECK (true);

-- ── Storage ──────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('saladillo-export-photos', 'saladillo-export-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública de fotos
CREATE POLICY "Fotos de Saladillo Export son públicas"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'saladillo-export-photos');

-- Cualquier usuario puede subir fotos (formulario público)
CREATE POLICY "Permitir subir fotos de Saladillo Export"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'saladillo-export-photos');
