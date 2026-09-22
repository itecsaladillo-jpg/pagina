-- Agregar columna de tipo de grafico a las preguntas
ALTER TABLE public.poll_questions ADD COLUMN chart_type text default 'bar' not null;
