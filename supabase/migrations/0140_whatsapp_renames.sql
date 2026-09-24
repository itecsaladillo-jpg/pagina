-- =============================================================
-- Migración 0140: Módulo WhatsApp — esquema completo idempotente
-- Crea tablas si no existen (con nomenclatura final); renombra
-- columnas si existen con nomenclatura vieja; conserva datos.
-- =============================================================

-- ── set_updated_at (por si no existe) ────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── whatsapp_templates ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      text        NOT NULL,
  contenido   text        NOT NULL,
  categoria   text        NOT NULL DEFAULT 'general'
              CHECK (categoria IN ('general', 'evento', 'socio', 'sponsor', 'medio')),
  autor_id    uuid        REFERENCES members(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Renombra solo si existe la columna vieja y no la nueva
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'whatsapp_templates'
      AND column_name = 'cuerpo'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'whatsapp_templates'
      AND column_name = 'contenido'
  ) THEN
    ALTER TABLE whatsapp_templates RENAME COLUMN cuerpo TO contenido;
  END IF;
END $$;

-- ── whatsapp_logs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario_numero  text        NOT NULL,
  destinatario_nombre  text,
  template_id          uuid        REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
  mensaje_enviado      text        NOT NULL,
  enviado_por          uuid        REFERENCES members(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ── whatsapp_contacts ───────────────────────────────────────
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'whatsapp_contacts'
      AND column_name = 'es_agenda_itec'
  ) THEN
    ALTER TABLE whatsapp_contacts ADD COLUMN es_agenda_itec boolean NOT NULL DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'whatsapp_contacts_telefono_unique'
  ) THEN
    ALTER TABLE whatsapp_contacts
      ADD CONSTRAINT whatsapp_contacts_telefono_unique UNIQUE (telefono);
  END IF;
END $$;

-- Permite fuente = 'miembro' (importación desde tabla members)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'whatsapp_contacts_fuente_check'
      AND pg_get_constraintdef(oid) LIKE '%vcf%'
  ) THEN
    ALTER TABLE whatsapp_contacts DROP CONSTRAINT whatsapp_contacts_fuente_check;
  END IF;

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

-- ── whatsapp_groups ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_groups (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_grupo  text        NOT NULL,
  descripcion   text,
  color         text        NOT NULL DEFAULT '#25d366',
  creado_por    uuid        REFERENCES members(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'whatsapp_groups'
      AND column_name = 'nombre'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'whatsapp_groups'
      AND column_name = 'nombre_grupo'
  ) THEN
    ALTER TABLE whatsapp_groups RENAME COLUMN nombre TO nombre_grupo;
  END IF;
END $$;

-- ── whatsapp_group_contacts ─────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_group_contacts (
  group_id    uuid NOT NULL REFERENCES whatsapp_groups(id)   ON DELETE CASCADE,
  contact_id  uuid NOT NULL REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  added_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, contact_id)
);

-- ── Índices ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wgc_group    ON whatsapp_group_contacts(group_id);
CREATE INDEX IF NOT EXISTS idx_wgc_contact  ON whatsapp_group_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_wc_creador   ON whatsapp_contacts(creado_por);

-- ── Triggers updated_at ─────────────────────────────────────
DROP TRIGGER IF EXISTS trg_whatsapp_templates_updated_at ON whatsapp_templates;
CREATE TRIGGER trg_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_whatsapp_groups_updated_at ON whatsapp_groups;
CREATE TRIGGER trg_whatsapp_groups_updated_at
  BEFORE UPDATE ON whatsapp_groups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE whatsapp_templates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_contacts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_groups         ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_group_contacts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'whatsapp_templates' AND policyname = 'admins_all_whatsapp_templates'
  ) THEN
    CREATE POLICY "admins_all_whatsapp_templates"
      ON whatsapp_templates FOR ALL
      USING (EXISTS (
        SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'whatsapp_logs' AND policyname = 'admins_all_whatsapp_logs'
  ) THEN
    CREATE POLICY "admins_all_whatsapp_logs"
      ON whatsapp_logs FOR ALL
      USING (EXISTS (
        SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'whatsapp_contacts' AND policyname = 'admins_all_whatsapp_contacts'
  ) THEN
    CREATE POLICY "admins_all_whatsapp_contacts"
      ON whatsapp_contacts FOR ALL
      USING (EXISTS (
        SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'whatsapp_groups' AND policyname = 'admins_all_whatsapp_groups'
  ) THEN
    CREATE POLICY "admins_all_whatsapp_groups"
      ON whatsapp_groups FOR ALL
      USING (EXISTS (
        SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'whatsapp_group_contacts'
      AND policyname = 'admins_all_whatsapp_group_contacts'
  ) THEN
    CREATE POLICY "admins_all_whatsapp_group_contacts"
      ON whatsapp_group_contacts FOR ALL
      USING (EXISTS (
        SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin'
      ));
  END IF;
END $$;

-- ── Plantillas iniciales (solo si la tabla está vacía) ──────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM whatsapp_templates WHERE contenido IS NOT NULL LIMIT 1) THEN
    INSERT INTO whatsapp_templates (titulo, contenido, categoria) VALUES
    (
      'Convocatoria a Evento',
      '¡Hola {{nombre}}! 👋 Te invitamos al próximo evento de ITEC Saladillo: *{{evento}}* el día {{fecha}}. ¡Esperamos contarte! Para más info: {{link}}',
      'evento'
    ),
    (
      'Bienvenida a Nuevo Socio',
      '¡Bienvenido/a a ITEC Saladillo, {{nombre}}! 🎉 Nos alegra que te hayas sumado. Podés acceder a tu panel en: https://saladillo.itec.ar/dashboard',
      'socio'
    ),
    (
      'Difusión de Nota Institucional',
      '📢 *ITEC Saladillo informa:*\n\n{{contenido}}\n\nMás información en nuestra web: https://saladillo.itec.ar',
      'general'
    ),
    (
      'Contacto con Sponsor',
      'Estimado/a {{nombre}}, desde ITEC Saladillo queremos agradecerle su apoyo y contarle las novedades de nuestra institución. ¿Tiene unos minutos para conversar?',
      'sponsor'
    ),
    (
      'Nota de Prensa a Medios',
      'Buenos días {{nombre}}, les enviamos la gacetilla de prensa: *{{evento}}*. Quedamos a disposición para ampliar la información. Muchas gracias.',
      'medio'
    );
  END IF;
END $$;
