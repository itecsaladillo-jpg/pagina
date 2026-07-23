CREATE TABLE IF NOT EXISTS public.ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  idea_text TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE NOT NULL,
  author_name TEXT NULL,
  author_email TEXT NULL,
  author_phone TEXT NULL,
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_revision', 'aprobada', 'descartada')) NOT NULL
);

ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir crear ideas al público" ON public.ideas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir lectura de ideas a miembros" ON public.ideas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir actualización de ideas a miembros" ON public.ideas
  FOR UPDATE USING (auth.role() = 'authenticated');
