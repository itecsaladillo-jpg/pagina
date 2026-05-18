-- ============================================================
-- ITEC Augusto Cicaré - Migración 014: Corrección de Políticas RLS para Acciones e Inscripciones
-- ============================================================

-- 1. Liberar la restricción estricta de status = 'activo' en itec_actions
drop policy if exists "Gestión total para staff activo" on public.itec_actions;

create policy "Gestión total para staff activo"
  on public.itec_actions for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
        and role in ('admin', 'coordinador')
    )
  );

-- 2. Permitir que los responsables gestionen sus propias acciones (Evita problemas de inserción)
drop policy if exists "Responsables gestionan sus propias acciones" on public.itec_actions;

create policy "Responsables gestionan sus propias acciones"
  on public.itec_actions for all
  using (auth.uid() = responsible_id)
  with check (auth.uid() = responsible_id);

-- 3. Liberar la restricción estricta en action_registrations
drop policy if exists "Staff activo gestiona inscripciones" on public.action_registrations;

create policy "Staff activo gestiona inscripciones"
  on public.action_registrations for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
        and role in ('admin', 'coordinador')
    )
  );
