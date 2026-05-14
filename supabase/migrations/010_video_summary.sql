-- Añadir columna de resumen IA a la tabla de videos
alter table public.videos add column if not exists ai_summary text;

comment on column public.videos.ai_summary is 'Resumen del video generado por Inteligencia Artificial (máximo 150 palabras).';
