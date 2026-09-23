-- =============================================================
-- Migración 0133: Agenda ITEC
-- Campo booleano para marcar contactos como parte de la agenda ITEC
-- =============================================================

ALTER TABLE whatsapp_contacts
  ADD COLUMN es_agenda_itec boolean NOT NULL DEFAULT true;
