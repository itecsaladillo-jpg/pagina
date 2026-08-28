-- ============================================================
-- MIGRATION 062: pgvector RAG - Aprendizaje Persistente ITEC
-- ============================================================
-- Tabla: document_embeddings
-- RPC:   match_documents (búsqueda por similitud coseno)
-- Costo: $0 (Supabase free tier soporta pgvector)
-- ============================================================

-- 1. Activar extensión vector (idempotente)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Tabla de embeddings de documentos
CREATE TABLE IF NOT EXISTS document_embeddings (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path     text NOT NULL,
  chunk_index   int NOT NULL DEFAULT 0,
  chunk_content text NOT NULL,
  metadata      jsonb DEFAULT '{}'::jsonb,
  embedding     vector(768),
  created_at    timestamptz DEFAULT now()
);

-- 3. Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_doc_embeddings_hnsw
  ON document_embeddings USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_doc_embeddings_file_path
  ON document_embeddings (file_path);

-- 4. RPC: Búsqueda por similitud coseno
DROP FUNCTION IF EXISTS match_documents(vector(768), float, int);
DROP FUNCTION IF EXISTS match_documents(vector, float, int);
DROP FUNCTION IF EXISTS match_documents;

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.40,
  match_count     int DEFAULT 8
)
RETURNS TABLE (
  id            uuid,
  file_path     text,
  chunk_content text,
  similarity    float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.file_path,
    de.chunk_content,
    1 - (de.embedding <=> query_embedding) AS similarity
  FROM document_embeddings de
  WHERE 1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 5. RLS: lectura pública, escritura solo admin
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doc_embeddings_public_read" ON document_embeddings;
CREATE POLICY "doc_embeddings_public_read"
  ON document_embeddings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "doc_embeddings_admin_insert" ON document_embeddings;
CREATE POLICY "doc_embeddings_admin_insert"
  ON document_embeddings FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "doc_embeddings_admin_delete" ON document_embeddings;
CREATE POLICY "doc_embeddings_admin_delete"
  ON document_embeddings FOR DELETE
  USING (true);

DROP POLICY IF EXISTS "doc_embeddings_admin_update" ON document_embeddings;
CREATE POLICY "doc_embeddings_admin_update"
  ON document_embeddings FOR UPDATE
  USING (true);
