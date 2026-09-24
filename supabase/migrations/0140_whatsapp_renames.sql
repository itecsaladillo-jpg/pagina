-- =============================================================
-- Migración 0140: Alineación de nomenclatura WhatsApp
-- Renombra columnas conservando todos los datos existentes.
-- =============================================================

DO $$
BEGIN
  -- whatsapp_groups: nombre → nombre_grupo
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_groups' AND column_name = 'nombre'
  ) THEN
    ALTER TABLE whatsapp_groups RENAME COLUMN nombre TO nombre_grupo;
  END IF;

  -- whatsapp_templates: cuerpo → contenido
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_templates' AND column_name = 'cuerpo'
  ) THEN
    ALTER TABLE whatsapp_templates RENAME COLUMN cuerpo TO contenido;
  END IF;
END $$;
