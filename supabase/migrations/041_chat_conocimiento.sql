create table public.chat_conocimiento (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  historial jsonb not null,
  tipo text not null default 'autogestion', -- 'autogestion' | 'manual'
  resumen text
);

alter table public.chat_conocimiento enable row level security;

create policy "Permitir inserción pública de chat_conocimiento"
  on public.chat_conocimiento for insert
  with check (true);

create policy "Permitir lectura a usuarios autenticados"
  on public.chat_conocimiento for select
  using (auth.role() = 'authenticated');
