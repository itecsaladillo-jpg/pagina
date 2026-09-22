-- =============================================================
-- Migración 013: Contactos externos y grupos de WhatsApp
-- Módulo: Herramientas de Administradores > WhatsApp
-- =============================================================

-- Contactos importados (externos a la tabla members)
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text        NOT NULL,
  telefono    text        NOT NULL,
  email       text,
  fuente      text        NOT NULL DEFAULT 'manual'
              CHECK (fuente IN ('manual', 'vcf', 'csv', 'device')),
  creado_por  uuid        REFERENCES members(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Grupos de contactos reutilizables
CREATE TABLE IF NOT EXISTS whatsapp_groups (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text        NOT NULL,
  descripcion text,
  color       text        NOT NULL DEFAULT '#25d366',
  creado_por  uuid        REFERENCES members(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Trigger updated_at para groups
DROP TRIGGER IF EXISTS trg_whatsapp_groups_updated_at ON whatsapp_groups;
CREATE TRIGGER trg_whatsapp_groups_updated_at
  BEFORE UPDATE ON whatsapp_groups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Tabla de relación N:M grupos <-> contactos
CREATE TABLE IF NOT EXISTS whatsapp_group_contacts (
  group_id    uuid NOT NULL REFERENCES whatsapp_groups(id)   ON DELETE CASCADE,
  contact_id  uuid NOT NULL REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  added_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, contact_id)
);

-- ── Índices de rendimiento ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wgc_group    ON whatsapp_group_contacts(group_id);
CREATE INDEX IF NOT EXISTS idx_wgc_contact  ON whatsapp_group_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_wc_creador   ON whatsapp_contacts(creado_por);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE whatsapp_contacts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_groups         ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_group_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_all_whatsapp_contacts"
  ON whatsapp_contacts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "admins_all_whatsapp_groups"
  ON whatsapp_groups FOR ALL
  USING (EXISTS (
    SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "admins_all_whatsapp_group_contacts"
  ON whatsapp_group_contacts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin'
  ));
