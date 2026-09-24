-- =============================================================
-- Fix inmediato: ampliar CHECK de whatsapp_contacts.fuente
-- para aceptar 'miembro' (importación desde tabla members).
-- Idempotente: se puede ejecutar las veces que haga falta.
-- =============================================================

DO $$
BEGIN
  -- Elimina el CHECK viejo si existe y no contempla 'miembro'
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'whatsapp_contacts_fuente_check'
      AND pg_get_constraintdef(oid) NOT LIKE '%miembro%'
  ) THEN
    ALTER TABLE whatsapp_contacts DROP CONSTRAINT whatsapp_contacts_fuente_check;
  END IF;

  -- Crea el CHECK nuevo si no existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'whatsapp_contacts_fuente_check'
      AND pg_get_constraintdef(oid) LIKE '%miembro%'
  ) THEN
    ALTER TABLE whatsapp_contacts
      ADD CONSTRAINT whatsapp_contacts_fuente_check
      CHECK (fuente IN ('manual', 'vcf', 'csv', 'device', 'miembro'));
  END IF;
END $$;
