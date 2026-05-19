-- ============================================================
-- ITEC Augusto Cicaré - Migración 020: Extender Permisos de Moderación de Preguntas al rol Colaborador
-- ============================================================

-- 1. Actualizar políticas de la tabla public.evento_preguntas para incluir el rol 'colaborador'
drop policy if exists "Cualquiera puede ver preguntas aprobadas" on public.evento_preguntas;
create policy "Cualquiera puede ver preguntas aprobadas"
  on public.evento_preguntas for select
  using (
    aprobada = true or exists (
      select 1 from public.members
      where id = auth.uid()
        and role in ('admin', 'coordinador', 'colaborador')
    )
  );

drop policy if exists "Staff activo gestiona preguntas" on public.evento_preguntas;
create policy "Staff activo gestiona preguntas"
  on public.evento_preguntas for all
  using (
    exists (
      select 1 from public.members
      where id = auth.uid()
        and role in ('admin', 'coordinador', 'colaborador')
    )
  );
