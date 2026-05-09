-- ============================================================
-- ITEC Augusto Cicaré - Migración 005: Políticas de Administración
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Políticas para la tabla MEMBERS
-- Permitir que los admins actualicen cualquier perfil
create policy "Admins pueden actualizar cualquier miembro"
  on public.members
  for update
  using (
    exists (
      select 1 from public.members
      where id = auth.uid() and role = 'admin'
    )
  );

-- 2. Políticas para la tabla COMMISSIONS
-- Solo admins pueden insertar/actualizar/borrar comisiones
create policy "Solo admins gestionan comisiones"
  on public.commissions
  for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid() and role = 'admin'
    )
  );

-- 3. Políticas para la tabla COMMISSION_MEMBERS
-- Solo admins y coordinadores pueden gestionar miembros de comisión
create policy "Admins y coordinadores gestionan pertenencia a comisiones"
  on public.commission_members
  for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid() and (role = 'admin' or role = 'coordinador')
    )
  );
