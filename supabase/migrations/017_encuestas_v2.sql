-- 1. Renombrar columna 'question' a 'name' en polls
ALTER TABLE public.polls RENAME COLUMN question TO name;

-- 2. Crear tabla de preguntas
CREATE TABLE public.poll_questions (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references public.polls(id) on delete cascade not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Insertar una pregunta por defecto para las encuestas existentes para no romper la integridad
INSERT INTO public.poll_questions (poll_id, text)
SELECT id, name FROM public.polls;

-- 4. Modificar poll_options
-- Agregar question_id
ALTER TABLE public.poll_options ADD COLUMN question_id uuid references public.poll_questions(id) on delete cascade;

-- Asignar la pregunta correspondiente
UPDATE public.poll_options
SET question_id = (SELECT id FROM public.poll_questions WHERE poll_id = public.poll_options.poll_id LIMIT 1);

-- Manejar el caso donde option_text pueda existir (limpieza)
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='poll_options' and column_name='option_text') THEN
      -- Si "text" no existe, lo renombramos. Si ya existe, eliminamos "option_text" que es redundante.
      IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='poll_options' and column_name='text') THEN
          ALTER TABLE public.poll_options RENAME COLUMN option_text TO text;
      ELSE
          ALTER TABLE public.poll_options DROP COLUMN option_text;
      END IF;
  END IF;
END $$;

-- Eliminar poll_id y hacer question_id NOT NULL
ALTER TABLE public.poll_options DROP COLUMN poll_id;
ALTER TABLE public.poll_options ALTER COLUMN question_id SET NOT NULL;

-- 5. RLS para poll_questions
ALTER TABLE public.poll_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede ver preguntas" 
  ON public.poll_questions FOR SELECT USING (true);
CREATE POLICY "Miembros pueden gestionar preguntas" 
  ON public.poll_questions FOR ALL USING (auth.role() = 'authenticated');
