-- ============================================================
-- ITEC Augusto Cicaré - Migración 076: Eliminar publicación Huertas Comunitarias
-- ============================================================

DELETE FROM public.public_articles 
WHERE id = '5f16b61e-195b-4813-8b4b-0ae939ef6018'
   OR slug = 'huertas-comunitarias-impulsan-soberana-alimentaria-0776'
   OR title ILIKE '%Huertas comunitarias impulsan soberan%';
