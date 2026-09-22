-- ============================================================
-- ITEC Augusto Cicaré - Migración 077: Eliminar publicaciones legadas de public_articles
-- ============================================================

DELETE FROM public.public_articles 
WHERE id IN (
  'd386b673-1d49-4dee-a764-238b59c74a1f', -- Vanguardia y Arraigo
  'e323c22f-f240-45c8-b819-b9cb1b01f5ef', -- Soldando el futuro industrial
  'c5220887-fd0a-4e0d-8b54-fc9018ea3baf', -- Sinergia Estratégica
  '5a019af9-e342-4717-860c-d59b813338ae'  -- Liderazgo biotecnológico
);
