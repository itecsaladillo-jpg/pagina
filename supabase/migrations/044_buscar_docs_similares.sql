-- ============================================================
-- ITEC Augusto Cicaré — Migración 044: Búsqueda vectorial de docs
-- ============================================================
-- Esta migración prepara la infraestructura para que los documentos
-- subidos al bucket "training-docs" puedan tener embeddings vectoriales
-- almacenados en la base de datos, habilitando búsqueda semántica real
-- como alternativa al keyword scoring actual de P2.
--
-- Para activar la búsqueda vectorial en P2:
--   1. Ejecutar esta migración.
--   2. Al subir un doc al bucket, también insertar un registro en esta tabla
--      con su texto extraído y su embedding generado (768 dims, Gemini text-embedding-004).
--   3. La función RPC buscar_docs_similares puede usarse desde ragCascade.ts
--      si se quiere reemplazar el keyword scoring por similitud coseno.
-- ============================================================

-- Requiere pgvector (ya habilitado en migración 024)
create extension if not exists vector with schema public;

-- Tabla de metadatos y embeddings de documentos del bucket
create table if not exists public.training_docs_embeddings (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamp with time zone default timezone('utc', now()) not null,
  updated_at    timestamp with time zone default timezone('utc', now()) not null,

  -- Nombre del archivo en el bucket "training-docs"
  nombre_archivo  text not null unique,
  -- Texto extraído del documento (para keyword scoring de respaldo)
  contenido_texto text not null default '',
  -- Embedding vectorial (768 dims, modelo text-embedding-004 de Google)
  embedding       vector(768),
  -- Metadata adicional (fecha de ingesta, tipo de doc, etc.)
  metadata        jsonb default '{}'::jsonb
);

-- Índice HNSW para búsquedas de similitud de coseno
create index if not exists training_docs_embedding_idx
  on public.training_docs_embeddings
  using hnsw (embedding vector_cosine_ops);

-- Habilitar RLS
alter table public.training_docs_embeddings enable row level security;

-- Lectura pública (el asistente lo consulta desde edge sin autenticación de usuario)
create policy "Training docs embeddings son públicos para lectura"
  on public.training_docs_embeddings for select
  using (true);

-- Solo admins pueden insertar/actualizar embeddings
create policy "Solo admins insertan training doc embeddings"
  on public.training_docs_embeddings for insert
  with check (
    exists (
      select 1 from public.members
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Solo admins actualizan training doc embeddings"
  on public.training_docs_embeddings for update
  using (
    exists (
      select 1 from public.members
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Solo admins borran training doc embeddings"
  on public.training_docs_embeddings for delete
  using (
    exists (
      select 1 from public.members
      where id = auth.uid() and role = 'admin'
    )
  );

-- Trigger para actualizar updated_at automáticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger training_docs_embeddings_updated_at
  before update on public.training_docs_embeddings
  for each row execute function public.set_updated_at();

-- ============================================================
-- RPC: buscar_docs_similares
-- Búsqueda vectorial semántica sobre los documentos del bucket.
-- Puede usarse como reemplazo del keyword scoring en P2 de ragCascade.ts.
--
-- Parámetros:
--   query_embedding     — Vector de 768 dims del mensaje del usuario
--   similarity_threshold — Umbral mínimo de similitud coseno (ej: 0.40)
--   match_count         — Máximo de resultados a retornar
-- ============================================================
create or replace function public.buscar_docs_similares(
  query_embedding     vector(768),
  similarity_threshold float,
  match_count         int
)
returns table (
  id              uuid,
  nombre_archivo  text,
  contenido_texto text,
  similarity      float
)
language plpgsql
security definer
as $$
begin
  return query
  select
    tde.id,
    tde.nombre_archivo,
    tde.contenido_texto,
    (1 - (tde.embedding <=> query_embedding))::float as similarity
  from public.training_docs_embeddings tde
  where
    tde.embedding is not null
    and (1 - (tde.embedding <=> query_embedding)) > similarity_threshold
  order by tde.embedding <=> query_embedding
  limit match_count;
end;
$$;
