-- ============================================================
-- ITEC Augusto Cicaré — Migración 045: Persistencia de conversaciones
-- ============================================================
-- Almacena historial de chats con embeddings vectoriales para
-- recuperación semántica (P4 de la cascada RAG).
-- Las sesiones son anónimas: se identifican por un UUID generado
-- en el cliente y persistido en localStorage.
-- ============================================================

-- Requiere pgvector (ya habilitado en migración 024)
create extension if not exists vector with schema public;

-- ============================================================
-- Tabla principal
-- ============================================================
create table if not exists public.saved_conversations (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamp with time zone default timezone('utc', now()) not null,

  -- Identificador de sesión anónima (UUID generado por el cliente)
  session_id           text not null,

  -- Extracto formateado del historial usado para generar el embedding
  -- (últimos 20 mensajes, máx 2000 chars). También sirve como preview.
  resumen              text not null default '',

  -- Embedding del resumen (768 dims — Gemini text-embedding-004)
  embedding            vector(768),

  -- Historial completo de la conversación en formato [{role, content}]
  historial            jsonb not null default '[]'::jsonb,

  -- Número de turnos (pares usuario/asistente)
  turno_count          integer not null default 0,

  -- true si fue activado por comando explícito del usuario
  guardado_manualmente boolean not null default false
);

-- Índice HNSW para búsqueda vectorial de coseno
create index if not exists saved_conversations_embedding_idx
  on public.saved_conversations
  using hnsw (embedding vector_cosine_ops);

-- Índice sobre session_id para filtrar por sesión eficientemente
create index if not exists saved_conversations_session_idx
  on public.saved_conversations (session_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.saved_conversations enable row level security;

-- Lectura: solo puede leer quien generó la sesión (por session_id).
-- Como el session_id no está vinculado a auth.uid(), la política
-- es de "confianza en el cliente" — cualquiera que conozca el
-- session_id puede leer esas filas. Adecuado para uso anónimo.
create policy "Lectura pública de conversaciones propias"
  on public.saved_conversations for select
  using (true);

-- Inserción: permitida sin autenticación (sesiones anónimas)
create policy "Inserción anónima de conversaciones"
  on public.saved_conversations for insert
  with check (true);

-- Borrado: solo admins autenticados pueden purgar registros
create policy "Solo admins borran conversaciones guardadas"
  on public.saved_conversations for delete
  using (
    exists (
      select 1 from public.members
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- RPC: buscar_conversaciones_similares
-- Búsqueda vectorial semántica filtrada por session_id.
--
-- Parámetros:
--   query_embedding      — Vector 768 dims del mensaje del usuario
--   p_session_id         — UUID de sesión del cliente
--   similarity_threshold — Umbral mínimo [0–1] (recomendado: 0.35)
--   match_count          — Máximo de resultados (recomendado: 3)
-- ============================================================
create or replace function public.buscar_conversaciones_similares(
  query_embedding      vector(768),
  p_session_id         text,
  similarity_threshold float,
  match_count          int
)
returns table (
  id           uuid,
  resumen      text,
  turno_count  integer,
  similarity   float
)
language plpgsql
security definer
as $$
begin
  return query
  select
    sc.id,
    sc.resumen,
    sc.turno_count,
    (1 - (sc.embedding <=> query_embedding))::float as similarity
  from public.saved_conversations sc
  where
    sc.session_id = p_session_id
    and sc.embedding is not null
    and (1 - (sc.embedding <=> query_embedding)) > similarity_threshold
  order by sc.embedding <=> query_embedding
  limit match_count;
end;
$$;
