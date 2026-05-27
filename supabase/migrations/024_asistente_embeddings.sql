-- Habilitar la extensión pgvector si no está habilitada
create extension if not exists vector with schema public;

-- Agregar la columna embedding de 768 dimensiones (para text-embedding-004 de Google)
alter table public.asistente_feedback 
  add column if not exists embedding vector(768);

-- Crear el índice HNSW para búsquedas de similitud de coseno ultrarrápidas
create index if not exists asistente_feedback_embedding_idx 
  on public.asistente_feedback 
  using hnsw (embedding vector_cosine_ops);

-- Crear la función RPC buscar_feedbacks_similares para el RAG semántico
create or replace function public.buscar_feedbacks_similares(
  query_embedding vector(768),
  similarity_threshold float,
  match_count int
)
returns table (
  id uuid,
  created_at timestamp with time zone,
  historial jsonb,
  calificacion text,
  comentario text,
  tema_principal text,
  lo_mas_util text,
  similarity float
)
language plpgsql
security definer
as $$
begin
  return query
  select
    af.id,
    af.created_at,
    af.historial,
    af.calificacion,
    af.comentario,
    af.tema_principal,
    af.lo_mas_util,
    (1 - (af.embedding <=> query_embedding))::float as similarity
  from public.asistente_feedback af
  where af.embedding is not null
    and (1 - (af.embedding <=> query_embedding)) > similarity_threshold
    and af.calificacion in ('muy_util', 'util')
  order by af.embedding <=> query_embedding
  limit match_count;
end;
$$;
