-- ============================================================
-- Migración 073: Regla de oro - matiasvidal11972@gmail.com siempre admin
-- Trigger que fuerza el rol admin para este email en toda inserción/actualización
-- ============================================================

-- Función trigger
CREATE OR REPLACE FUNCTION public.enforce_matias_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF LOWER(NEW.email) = 'matiasvidal11972@gmail.com' THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger en INSERT
DROP TRIGGER IF EXISTS trg_enforce_matias_admin_insert ON public.members;
CREATE TRIGGER trg_enforce_matias_admin_insert
  BEFORE INSERT ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_matias_admin();

-- Trigger en UPDATE (si alguien intenta cambiar el rol)
DROP TRIGGER IF EXISTS trg_enforce_matias_admin_update ON public.members;
CREATE TRIGGER trg_enforce_matias_admin_update
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_matias_admin();

-- Forzar el rol admin ahora mismo
UPDATE public.members
SET role = 'admin'
WHERE LOWER(email) = 'matiasvidal11972@gmail.com';
