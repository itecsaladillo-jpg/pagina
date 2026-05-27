-- ============================================================
-- ITEC Augusto Cicaré - Migración 030: Teléfono en Mapa de Empresas
-- ============================================================

-- Agregar la columna telefono a la tabla mapa_empresas si no existe
ALTER TABLE public.mapa_empresas 
ADD COLUMN IF NOT EXISTS telefono TEXT;
