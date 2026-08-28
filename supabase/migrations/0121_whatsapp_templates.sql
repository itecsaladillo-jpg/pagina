-- =============================================================
-- Migración 012: Plantillas y logs de WhatsApp
-- Módulo: Herramientas de Administradores > WhatsApp
-- =============================================================

-- Tabla de plantillas de mensajes reutilizables
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      text        NOT NULL,
  cuerpo      text        NOT NULL,
  categoria   text        NOT NULL DEFAULT 'general'
              CHECK (categoria IN ('general', 'evento', 'socio', 'sponsor', 'medio')),
  autor_id    uuid        REFERENCES members(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Tabla de auditoría: cada vez que un admin abre un link de WhatsApp se registra
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario_numero  text        NOT NULL,
  destinatario_nombre  text,
  template_id          uuid        REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
  mensaje_enviado      text        NOT NULL,
  enviado_por          uuid        REFERENCES members(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- Trigger para updated_at automático en templates
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_whatsapp_templates_updated_at ON whatsapp_templates;
CREATE TRIGGER trg_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs      ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver y modificar plantillas
CREATE POLICY "admins_all_whatsapp_templates"
  ON whatsapp_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Solo admins pueden ver y registrar logs
CREATE POLICY "admins_all_whatsapp_logs"
  ON whatsapp_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── Plantillas iniciales de ejemplo ────────────────────────
INSERT INTO whatsapp_templates (titulo, cuerpo, categoria) VALUES
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
)
ON CONFLICT DO NOTHING;
