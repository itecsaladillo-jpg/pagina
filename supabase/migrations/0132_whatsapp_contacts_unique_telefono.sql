-- =============================================================
-- Migración 0132: UNIQUE constraint en telefono para upsert
-- =============================================================

-- La tabla whatsapp_contacts necesita un UNIQUE constraint en telefono
-- para que saveContactsBulkAction funcione con upsert(onConflict: 'telefono')
ALTER TABLE whatsapp_contacts
  ADD CONSTRAINT whatsapp_contacts_telefono_unique UNIQUE (telefono);
