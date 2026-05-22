-- Crear tabla para almacenar feedback y aprendizajes del Asistente ITEC
create table public.asistente_feedback (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  historial jsonb not null,
  calificacion text not null, -- 'muy_util' | 'util' | 'neutral' | 'poco_util' | 'cerrado_sin_feedback'
  comentario text,
  tema_principal text,
  lo_mas_util text
);

-- Habilitar RLS (Row Level Security)
alter table public.asistente_feedback enable row level security;

-- Políticas de RLS
-- Permitir inserción anónima pública
create policy "Permitir inserción pública de feedback"
  on public.asistente_feedback for insert
  with check (true);

-- Permitir lectura únicamente a miembros de la organización (autenticados)
create policy "Permitir lectura a usuarios autenticados"
  on public.asistente_feedback for select
  using (auth.role() = 'authenticated');
