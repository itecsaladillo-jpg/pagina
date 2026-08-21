-- Migración 067: Tabla de Socios Estratégicos (Instituciones y Organismos)
-- Crea la tabla strategic_partners para almacenar instituciones aliadas

-- 1. Crear tabla strategic_partners
CREATE TABLE IF NOT EXISTS strategic_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT, -- Institución Educativa, Organismo Público, ONG / Asociación, Empresa Aliada
  actions_description TEXT NOT NULL, -- Descripción de las acciones que ITEC desarrolla con la entidad
  logo_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE strategic_partners ENABLE ROW LEVEL SECURITY;

-- 3. Política de lectura pública (cualquiera puede ver socios estratégicos activos)
CREATE POLICY "strategic_partners_select_public" ON strategic_partners
  FOR SELECT
  USING (is_active = true);

-- 4. Política de escritura solo para admins
CREATE POLICY "strategic_partners_insert_admin" ON strategic_partners
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.role = 'admin'
    )
  );

CREATE POLICY "strategic_partners_update_admin" ON strategic_partners
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.role = 'admin'
    )
  );

CREATE POLICY "strategic_partners_delete_admin" ON strategic_partners
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.role = 'admin'
    )
  );

-- 5. Índices para búsquedas frecuentes
CREATE INDEX idx_strategic_partners_category ON strategic_partners(category);
CREATE INDEX idx_strategic_partners_active ON strategic_partners(is_active);

-- 6. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_strategic_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER strategic_partners_updated_at
  BEFORE UPDATE ON strategic_partners
  FOR EACH ROW
  EXECUTE FUNCTION update_strategic_partners_updated_at();