-- ============================================================
-- ITEC Augusto Cicaré - Migración 049: Semáforo de Comprensión
-- ============================================================

-- 1. Agregar columna de reseteo del semáforo en eventos
alter table public.eventos
  add column if not exists semaforo_last_reset_at timestamptz default now();

-- 2. Tabla de votos del Semáforo de Comprensión
create table if not exists public.evento_semaforo_votos (
  id          uuid primary key default gen_random_uuid(),
  evento_id   uuid not null references public.eventos(id) on delete cascade,
  visitor_id  text not null,
  voto        text not null check (voto in ('positivo', 'negativo')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint evento_semaforo_votos_unique unique (evento_id, visitor_id)
);

-- 3. Trigger para actualizar updated_at en votos
create or replace function public.handle_updated_at_semaforo_votos()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_semaforo_votos
  before update on public.evento_semaforo_votos
  for each row execute function public.handle_updated_at_semaforo_votos();

-- ============================================================
-- SEGURIDAD: RLS y Políticas
-- ============================================================

alter table public.evento_semaforo_votos enable row level security;

-- Cualquiera puede ver los votos del semáforo (para la pantalla en vivo)
create policy "Cualquiera puede ver votos del semáforo"
  on public.evento_semaforo_votos for select
  using (true);

-- Cualquiera puede insertar o actualizar su propio voto (asistente)
create policy "Cualquiera puede votar en el semáforo"
  on public.evento_semaforo_votos for insert
  with check (true);

create policy "Cualquiera puede actualizar su voto en el semáforo"
  on public.evento_semaforo_votos for update
  using (true)
  with check (true);

-- Solo el staff puede eliminar votos (reseteo)
create policy "Staff puede eliminar votos del semáforo"
  on public.evento_semaforo_votos for delete
  using (exists (select 1 from public.members where id = auth.uid()));

-- ============================================================
-- SUPABASE REALTIME
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'evento_semaforo_votos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.evento_semaforo_votos;
  END IF;
END
$$;
