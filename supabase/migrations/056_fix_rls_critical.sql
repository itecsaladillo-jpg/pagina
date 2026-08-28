-- ============================================================
-- ITEC Saladillo — Migración 056: Fix RLS Crítico
-- ============================================================
-- Corrige políticas RLS excesivamente permisivas en:
--   - clases_virtuales (USING(true) permitía CRUD anónimo)
--   - clase_interacciones (USING(true) permitía UPSERT anónimo)
--   - certificados_digitales (USING(true) permitía forjar certificados)
--   - saved_conversations (agrega UPDATE restringido a admin)
-- ============================================================

-- ============================================================
-- 1. CLASES VIRTUALES
-- ============================================================
-- Eliminar políticas permisivas existentes
DROP POLICY IF EXISTS "Lectura pública de clases virtuales" ON public.clases_virtuales;
DROP POLICY IF EXISTS "Administración total de clases virtuales para administradores" ON public.clases_virtuales;

-- Lectura: cualquier usuario autenticado puede ver clases (para pantalla gigante)
DROP POLICY IF EXISTS "clases_virtuales_select_auth" ON public.clases_virtuales;
CREATE POLICY "clases_virtuales_select_auth"
  ON public.clases_virtuales FOR SELECT
  TO authenticated
  USING (true);

-- Lectura pública: solo lectura para anónimos (pantalla gigante pública)
DROP POLICY IF EXISTS "clases_virtuales_select_anon" ON public.clases_virtuales;
CREATE POLICY "clases_virtuales_select_anon"
  ON public.clases_virtuales FOR SELECT
  TO anon
  USING (true);

-- INSERT/UPDATE/DELETE: solo admin y coordinador
DROP POLICY IF EXISTS "clases_virtuales_insert_admin" ON public.clases_virtuales;
CREATE POLICY "clases_virtuales_insert_admin"
  ON public.clases_virtuales FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE id = auth.uid()
        AND role IN ('admin', 'coordinador')
        AND status = 'activo'
    )
  );

DROP POLICY IF EXISTS "clases_virtuales_update_admin" ON public.clases_virtuales;
CREATE POLICY "clases_virtuales_update_admin"
  ON public.clases_virtuales FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE id = auth.uid()
        AND role IN ('admin', 'coordinador')
        AND status = 'activo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE id = auth.uid()
        AND role IN ('admin', 'coordinador')
        AND status = 'activo'
    )
  );

DROP POLICY IF EXISTS "clases_virtuales_delete_admin" ON public.clases_virtuales;
CREATE POLICY "clases_virtuales_delete_admin"
  ON public.clases_virtuales FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE id = auth.uid()
        AND role IN ('admin', 'coordinador')
        AND status = 'activo'
    )
  );

-- ============================================================
-- 2. CLASE INTERACCIONES
-- ============================================================
-- Eliminar políticas permisivas existentes
DROP POLICY IF EXISTS "Lectura pública de interacciones de clase" ON public.clase_interacciones;
DROP POLICY IF EXISTS "Estudiantes pueden insertar/actualizar sus interacciones (UPSERT)" ON public.clase_interacciones;

-- Lectura: cualquier usuario autenticado puede ver interacciones
DROP POLICY IF EXISTS "clase_interacciones_select" ON public.clase_interacciones;
CREATE POLICY "clase_interacciones_select"
  ON public.clase_interacciones FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: cualquier usuario autenticado puede insertar sus interacciones
DROP POLICY IF EXISTS "clase_interacciones_insert" ON public.clase_interacciones;
CREATE POLICY "clase_interacciones_insert"
  ON public.clase_interacciones FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: solo el propio usuario puede actualizar sus interacciones
-- o un admin/coordinador puede actualizar cualquiera
DROP POLICY IF EXISTS "clase_interacciones_update" ON public.clase_interacciones;
CREATE POLICY "clase_interacciones_update"
  ON public.clase_interacciones FOR UPDATE
  TO authenticated
  USING (
    -- Es admin/coordinador
    EXISTS (
      SELECT 1 FROM public.members
      WHERE id = auth.uid()
        AND role IN ('admin', 'coordinador')
        AND status = 'activo'
    )
  )
  WITH CHECK (true);

-- DELETE: solo admin/coordinador
DROP POLICY IF EXISTS "clase_interacciones_delete" ON public.clase_interacciones;
CREATE POLICY "clase_interacciones_delete"
  ON public.clase_interacciones FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE id = auth.uid()
        AND role IN ('admin', 'coordinador')
        AND status = 'activo'
    )
  );

-- ============================================================
-- 3. CERTIFICADOS DIGITALES
-- ============================================================
-- Eliminar políticas permisivas existentes
DROP POLICY IF EXISTS "Lectura pública de certificados mediante código de verificación" ON public.certificados_digitales;
DROP POLICY IF EXISTS "Administración total de certificados para administradores" ON public.certificados_digitales;

-- Lectura pública: cualquiera puede verificar un certificado por código
-- (necesario para la página de verificación pública)
DROP POLICY IF EXISTS "certificados_digitales_select_public" ON public.certificados_digitales;
CREATE POLICY "certificados_digitales_select_public"
  ON public.certificados_digitales FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE: solo admin
DROP POLICY IF EXISTS "certificados_digitales_insert_admin" ON public.certificados_digitales;
CREATE POLICY "certificados_digitales_insert_admin"
  ON public.certificados_digitales FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE id = auth.uid()
        AND role = 'admin'
        AND status = 'activo'
    )
  );

DROP POLICY IF EXISTS "certificados_digitales_update_admin" ON public.certificados_digitales;
CREATE POLICY "certificados_digitales_update_admin"
  ON public.certificados_digitales FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE id = auth.uid()
        AND role = 'admin'
        AND status = 'activo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE id = auth.uid()
        AND role = 'admin'
        AND status = 'activo'
    )
  );

DROP POLICY IF EXISTS "certificados_digitales_delete_admin" ON public.certificados_digitales;
CREATE POLICY "certificados_digitales_delete_admin"
  ON public.certificados_digitales FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE id = auth.uid()
        AND role = 'admin'
        AND status = 'activo'
    )
  );

-- ============================================================
-- 4. SAVED CONVERSATIONS
-- ============================================================
-- La tabla ya tiene SELECT e INSERT públicos (diseñado para sesiones anónimas)
-- y DELETE restringido a admin.
-- Agregamos UPDATE restringido a admin para evitar manipulación externa.

-- Verificar si ya existe una política de UPDATE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'saved_conversations'
      AND policyname = 'Solo admins actualizan conversaciones guardadas'
  ) THEN
    CREATE POLICY "Solo admins actualizan conversaciones guardadas"
      ON public.saved_conversations FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.members
          WHERE id = auth.uid()
            AND role = 'admin'
        )
      )
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- NOTAS:
-- - Los endpoints de Server Actions usan service_role bypassing RLS,
--   por lo que estos fixes protegen contra acceso directo a la API
--   y desde el browser sin autenticación.
-- - La política de saved_conversations permite INSERT público porque
--   las sesiones del chat son anónimas (session_id en localStorage).
-- ============================================================
