-- Permitir eliminación de ideas a miembros autenticados
-- La restricción de admin se maneja en el Server Action
CREATE POLICY "Permitir eliminación de ideas a miembros" ON public.ideas
  FOR DELETE USING (auth.role() = 'authenticated');
