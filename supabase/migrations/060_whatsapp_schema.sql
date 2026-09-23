-- ============================================================
-- ITEC Saladillo — Migración 060: WhatsApp Masivo
-- ============================================================
-- Tablas para gestión de contactos, grupos y plantillas de WhatsApp
-- para envío masivo mediante WhatsApp Web (sin envío automático).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL DEFAULT '',
  telefono TEXT NOT NULL,          -- formato E.164 (+549...)
  email TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_contact_group (
  contacto_id UUID NOT NULL REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE,
  grupo_id    UUID NOT NULL REFERENCES public.whatsapp_groups(id)   ON DELETE CASCADE,
  PRIMARY KEY (contacto_id, grupo_id)
);

CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,   -- permite \n, emojis, markdown WhatsApp (* _)
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_telefono ON public.whatsapp_contacts(telefono);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_nombre ON public.whatsapp_contacts(nombre, apellido);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_titulo ON public.whatsapp_templates(titulo);

-- RLS policies (assuming existing pattern: select for authenticated, insert/update/delete for admin)
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_contact_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Select: authenticated users can read
DROP POLICY IF EXISTS "whatsapp_contacts_select_auth" ON public.whatsapp_contacts;
CREATE POLICY "whatsapp_contacts_select_auth"
  ON public.whatsapp_contacts FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "whatsapp_groups_select_auth" ON public.whatsapp_groups;
CREATE POLICY "whatsapp_groups_select_auth"
  ON public.whatsapp_groups FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "whatsapp_contact_group_select_auth" ON public.whatsapp_contact_group;
CREATE POLICY "whatsapp_contact_group_select_auth"
  ON public.whatsapp_contact_group FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "whatsapp_templates_select_auth" ON public.whatsapp_templates;
CREATE POLICY "whatsapp_templates_select_auth"
  ON public.whatsapp_templates FOR SELECT
  TO authenticated
  USING (true);

-- Insert/Update/Delete: only admin (role = 'admin')
DROP POLICY IF EXISTS "whatsapp_contacts_insert_admin" ON public.whatsapp_contacts;
CREATE POLICY "whatsapp_contacts_insert_admin"
  ON public.whatsapp_contacts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'activo')
  );

DROP POLICY IF EXISTS "whatsapp_contacts_update_admin" ON public.whatsapp_contacts;
CREATE POLICY "whatsapp_contacts_update_admin"
  ON public.whatsapp_contacts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'activo')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'activo')
  );

DROP POLICY IF EXISTS "whatsapp_contacts_delete_admin" ON public.whatsapp_contacts;
CREATE POLICY "whatsapp_contacts_delete_admin"
  ON public.whatsapp_contacts FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'activo')
  );

-- Similar for groups
DROP POLICY IF EXISTS "whatsapp_groups_insert_admin" ON public.whatsapp_groups;
CREATE POLICY "whatsapp_groups_insert_admin"
  ON public.whatsapp_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'activo')
  );

DROP POLICY IF EXISTS "whatsapp_groups_update_admin" ON public.whatsapp_groups;
CREATE POLICY "whatsapp_groups_update_admin"
  ON public.whatsapp_groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'activo')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'activo')
  );

DROP POLICY IF EXISTS "whatsapp_groups_delete_admin" ON public.whatsapp_groups;
CREATE POLICY "whatsapp_groups_delete_admin"
  ON public.whatsapp_groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'activo')
  );

-- For contact_group
DROP POLICY IF EXISTS "whatsapp_contact_group_insert_admin" ON public.whatsapp_contact_group;
CREATE POLICY "whatsapp_contact_group_insert_admin"
  ON public.whatsapp_contact_group FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'activo')
  );

DROP POLICY IF EXISTS "whatsapp_contact_group_update_admin" ON public.whatsapp_contact_group;
CREATE POLICY "whatsapp_contact_group_update_admin"
  ON public.whatsapp_contact_group FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'activo')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'activo')
  );

DROP POLICY IF EXISTS "whatsapp_contact_group_delete_admin" ON public.whatsapp_contact_group;
CREATE POLICY "whatsapp_contact_group_delete_admin"
  ON public.whatsapp_contact_group FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'activo')
  );

-- For templates
DROP POLICY IF EXISTS "whatsapp_templates_insert_admin" ON public.whatsapp_templates;
CREATE POLICY "whatsapp_templates_insert_admin"
  ON public.whatsapp_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'activo')
  );

DROP POLICY IF EXISTS "whatsapp_templates_update_admin" ON public.whatsapp_templates;
CREATE POLICY "whatsapp_templates_update_admin"
  ON public.whatsapp_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'activo')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'activo')
  );

DROP POLICY IF EXISTS "whatsapp_templates_delete_admin" ON public.whatsapp_templates;
CREATE POLICY "whatsapp_templates_delete_admin"
  ON public.whatsapp_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'admin' AND status = 'activo')
  );