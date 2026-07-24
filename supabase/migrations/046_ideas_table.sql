-- Agregar columna idea_text a la tabla existente de ideas (buzón público)
-- La tabla ya existía con title/description, pero el formulario público necesita idea_text

ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS idea_text TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS author_email TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS author_phone TEXT;

-- Migrar datos existentes de title + description a idea_text si es necesario
UPDATE public.ideas SET idea_text = COALESCE(title, '') || ' ' || COALESCE(description, '') WHERE idea_text IS NULL;

-- Hacer idea_text NOT NULL para nuevos registros
ALTER TABLE public.ideas ALTER COLUMN idea_text SET NOT NULL;
ALTER TABLE public.ideas ALTER COLUMN title DROP NOT NULL;
ALTER TABLE public.ideas ALTER COLUMN description DROP NOT NULL;

-- Actualizar políticas RLS para permitir inserción pública
DROP POLICY IF EXISTS "Cualquier autenticado puede enviar ideas" ON public.ideas;
DROP POLICY IF EXISTS "Permitir crear ideas al público" ON public.ideas;
DROP POLICY IF EXISTS "Ideas visibles para autenticados" ON public.ideas;
DROP POLICY IF EXISTS "Permitir lectura de ideas a miembros" ON public.ideas;
DROP POLICY IF EXISTS "Permitir actualización de ideas a miembros" ON public.ideas;

-- Migrar estados existentes a los nuevos valores
ALTER TABLE public.ideas DROP CONSTRAINT IF EXISTS ideas_status_check;
ALTER TABLE public.ideas ADD CONSTRAINT ideas_status_check 
  CHECK (status IN ('pendiente', 'en_revision', 'aprobada', 'descartada'));
UPDATE public.ideas SET status = 'pendiente' WHERE status = 'nueva';
UPDATE public.ideas SET status = 'descartada' WHERE status IN ('rechazada', 'implementada');

CREATE POLICY "Permitir crear ideas al público" ON public.ideas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir lectura de ideas a miembros" ON public.ideas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir actualización de ideas a miembros" ON public.ideas
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Función RPC para insertar ideas desde el formulario público
DROP FUNCTION IF EXISTS public.insert_idea(text, boolean, text, text, text);
CREATE OR REPLACE FUNCTION public.insert_idea(
  idea_text TEXT,
  is_anonymous BOOLEAN,
  author_name TEXT,
  author_email TEXT,
  author_phone TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.ideas (idea_text, is_anonymous, author_name, author_email, author_phone)
  VALUES (idea_text, is_anonymous, author_name, author_email, author_phone);
END;
$$;