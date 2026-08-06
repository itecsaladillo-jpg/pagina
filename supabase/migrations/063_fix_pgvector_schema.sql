-- ============================================================
-- FIX SCHEMA: Alinear tablas y RPC con text-embedding-004
-- ============================================================
-- Problema: La tabla existente se llama "document_embeddings"
--           y usa uuid como id. El código espera "documents"
--           con id bigint.
-- Solución: Crear tabla "documents" correcta, migrar datos,
--           actualizar RPC y eliminar tabla vieja.
-- ============================================================

-- 1. Activar extensión vector (idempotente)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 2. Crear tabla "documents" con esquema correcto
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  file_path     text NOT NULL,
  chunk_content text NOT NULL,
  embedding     vector(768),
  created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- 3. Migrar datos de document_embeddings → documents (si existe)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'document_embeddings') THEN
    INSERT INTO documents (file_path, chunk_content, embedding)
    SELECT file_path, chunk_content, embedding
    FROM document_embeddings
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Datos migrados de document_embeddings → documents';
  END IF;
END $$;

-- ============================================================
-- 4. Índices para búsqueda eficiente
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_documents_hnsw
  ON documents USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_documents_file_path
  ON documents (file_path);

-- ============================================================
-- 5. RPC: match_documents ( LANGUAGE sql, id bigint )
-- ============================================================
-- IMPORTANTE: Primero eliminar la función vieja (return uuid)
-- porque PostgreSQL no permite cambiar el return type in-place.
-- ============================================================
DROP FUNCTION IF EXISTS match_documents(vector, double precision, integer);

CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count     int
)
RETURNS TABLE (
  id            bigint,
  file_path     text,
  chunk_content text,
  similarity    float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    documents.id,
    documents.file_path,
    documents.chunk_content,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- ============================================================
-- 6. RLS: lectura pública, escritura admin
-- ============================================================
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_public_read"
  ON documents FOR SELECT
  USING (true);

CREATE POLICY "documents_admin_insert"
  ON documents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "documents_admin_delete"
  ON documents FOR DELETE
  USING (true);

CREATE POLICY "documents_admin_update"
  ON documents FOR UPDATE
  USING (true);

-- ============================================================
-- 7. Limpiar tabla vieja (opcional, descomentar si se desea)
-- ============================================================
-- DROP TABLE IF EXISTS document_embeddings;
