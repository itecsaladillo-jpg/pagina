-- SQL para aplicar en Supabase SQL Editor

-- 1. Eliminar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Allow authenticated inserts" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;

-- 2. Políticas permissivas para depuración
DROP POLICY IF EXISTS "Permitir inserciones autenticadas" ON storage.objects;
CREATE POLICY "Permitir inserciones autenticadas" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'sponsors-logos');

DROP POLICY IF EXISTS "Permitir lectura publica" ON storage.objects;
CREATE POLICY "Permitir lectura publica" ON storage.objects
FOR SELECT
USING (bucket_id = 'sponsors-logos');
