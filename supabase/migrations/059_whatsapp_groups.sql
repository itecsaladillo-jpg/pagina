-- ============================================================
-- ITEC Saladillo — Migración 059: Grupos de WhatsApp
-- ============================================================
-- Tablas para gestionar grupos de contactos de WhatsApp
-- con los que se envían invitaciones a capacitaciones.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL DEFAULT '',
  telefono TEXT NOT NULL,
  notas TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agregar columna grupo_id si no existe (para migraciones parciales o re-ejecuciones)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'whatsapp_contacts' AND column_name = 'grupo_id'
  ) THEN
    ALTER TABLE public.whatsapp_contacts 
      ADD COLUMN grupo_id uuid REFERENCES public.whatsapp_groups(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Índice para búsqueda rápida por grupo
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_grupo ON public.whatsapp_contacts (grupo_id);

-- RLS policies
ALTER TABLE public.whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

-- Solo miembros autenticados pueden leer
DROP POLICY IF EXISTS "whatsapp_groups_select_auth" ON public.whatsapp_groups;
CREATE POLICY "whatsapp_groups_select_auth"
  ON public.whatsapp_groups FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "whatsapp_contacts_select_auth" ON public.whatsapp_contacts;
CREATE POLICY "whatsapp_contacts_select_auth"
  ON public.whatsapp_contacts FOR SELECT
  TO authenticated
  USING (true);

-- Solo admin puede insertar/actualizar/eliminar
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
