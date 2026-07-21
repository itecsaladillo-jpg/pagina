ALTER TABLE notas_sponsors
  ADD COLUMN media_urls jsonb DEFAULT '[]'::jsonb;

ALTER TABLE notas_medios
  ADD COLUMN media_urls jsonb DEFAULT '[]'::jsonb;
