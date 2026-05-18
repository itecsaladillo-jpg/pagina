-- Crear tabla principal de encuestas
create table public.polls (
  id uuid default gen_random_uuid() primary key,
  question text not null,
  is_active boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Crear tabla de opciones de la encuesta
create table public.poll_options (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references public.polls(id) on delete cascade not null,
  option_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Crear tabla de votos
create table public.poll_votes (
  id uuid default gen_random_uuid() primary key,
  option_id uuid references public.poll_options(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Configurar Seguridad de Nivel de Fila (RLS)
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

-- Políticas para 'polls'
-- Cualquiera puede leer encuestas activas
create policy "Cualquiera puede ver encuestas activas" 
  on public.polls for select using (is_active = true);
-- Usuarios autenticados pueden hacer todo
create policy "Miembros pueden gestionar encuestas" 
  on public.polls for all using (auth.role() = 'authenticated');

-- Políticas para 'poll_options'
-- Cualquiera puede leer opciones
create policy "Cualquiera puede ver opciones" 
  on public.poll_options for select using (true);
-- Usuarios autenticados pueden gestionar opciones
create policy "Miembros pueden gestionar opciones" 
  on public.poll_options for all using (auth.role() = 'authenticated');

-- Políticas para 'poll_votes'
-- Cualquiera puede leer los votos
create policy "Cualquiera puede ver los votos" 
  on public.poll_votes for select using (true);
-- Cualquiera puede votar (insertar)
create policy "Cualquiera puede insertar votos" 
  on public.poll_votes for insert with check (true);
-- Solo miembros pueden actualizar o borrar (opcional)
create policy "Miembros pueden gestionar votos" 
  on public.poll_votes for all using (auth.role() = 'authenticated');

-- ¡IMPORTANTE! Habilitar Realtime para la tabla poll_votes
alter publication supabase_realtime add table public.poll_votes;
