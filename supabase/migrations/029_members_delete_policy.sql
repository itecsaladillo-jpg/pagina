-- ============================================================
-- ITEC Augusto Cicaré - Migración 029: Política de Borrado de Miembros
-- ============================================================

-- Permitir que los administradores eliminen registros de miembros (rechazar peticiones)
create policy "Admins pueden borrar miembros"
  on public.members
  for delete
  using (
    exists (
      select 1 from public.members
      where id = auth.uid() and role = 'admin'
    )
  );
