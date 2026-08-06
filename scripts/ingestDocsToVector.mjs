/**
 * scripts/ingestDocsToVector.mjs
 * 
 * Ingesta documentos de /docs → chunks → embeddings (Gemini text-embedding-004)
 * → Inserta en tabla document_embeddings de Supabase.
 * 
 * Uso: node --env-file=.env scripts/ingestDocsToVector.mjs
 * 
 * Requiere en .env:
 *   GEMINI_APY_KEY=...        (o GEMINI_API_KEY)
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfParse from 'pdf-parse-new';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Configuración ─────────────────────────────────────────
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const CHUNK_SIZE = 900;   // caracteres por chunk
const CHUNK_OVERLAP = 120; // solape entre chunks
const EMBEDDING_DIM = 768;
const BATCH_SIZE = 20;     // embeddings por request (máx 100 para Gemini)

// ─── Env vars ──────────────────────────────────────────────
const GEMINI_KEY = process.env.GEMINI_APY_KEY || process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GEMINI_KEY) { console.error('Falta GEMINI_APY_KEY o GEMINI_API_KEY en .env'); process.exit(1); }
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env'); process.exit(1); }

// ─── Helpers ───────────────────────────────────────────────

/** Extrae texto de un PDF */
async function extractTextFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  try {
    const data = await pdfParse(dataBuffer);
    return data.text || '';
  } catch (err) {
    console.error(`  ✗ Error parseando ${path.basename(filePath)}:`, err.message);
    return '';
  }
}

/** Divide texto en chunks con solape */
function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length === 0) return chunks;

  let start = 0;
  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    const chunk = clean.slice(start, end).trim();
    if (chunk.length > 50) { // ignorar chunks muy cortos
      chunks.push(chunk);
    }
    if (end >= clean.length) break;
    start += chunkSize - overlap;
  }
  return chunks;
}

/** Genera embeddings en batch usando Gemini text-embedding-004 */
async function generateEmbeddings(texts) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: texts.map(t => ({ text: t })) },
        taskType: 'RETRIEVAL_DOCUMENT',
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.embeddings.map(e => e.values);
}

/** Inserta chunks en Supabase en batches */
async function insertChunks(chunks) {
  const batchSize = 50; // filas por request
  let inserted = 0;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(batch),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`  ✗ Error insertando batch ${i}:`, err);
    } else {
      inserted += batch.length;
    }
  }
  return inserted;
}

/** Elimina embeddings existentes de un archivo específico */
async function deleteExistingEmbeddings(filePath) {
  const encoded = encodeURIComponent(filePath);
  await fetch(`${SUPABASE_URL}/rest/v1/documents?file_path=eq.${encoded}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
}

// ─── Main ──────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  ITEC Vector Ingestion Pipeline v1.0     ║');
  console.log('╚══════════════════════════════════════════╝\n');
  console.log(`Directorio: ${DOCS_DIR}`);
  console.log(`Chunk size: ${CHUNK_SIZE} chars | Overlap: ${CHUNK_OVERLAP} chars`);
  console.log(`Gemini key: ${GEMINI_KEY.slice(0, 6)}...`);
  console.log(`Supabase:   ${SUPABASE_URL}\n`);

  if (!fs.existsSync(DOCS_DIR)) {
    console.error('Directorio /docs no encontrado.');
    process.exit(1);
  }

  // Limpiar embeddings existentes
  console.log('🗑  Limpiando embeddings existentes...');
  const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/documents?file_path=like.*`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  console.log(`   ${deleteRes.ok ? 'OK' : 'Error (continuando)'}\n`);

  const files = fs.readdirSync(DOCS_DIR).filter(f =>
    f.toLowerCase().endsWith('.pdf') ||
    f.toLowerCase().endsWith('.txt') ||
    f.toLowerCase().endsWith('.md')
  );

  console.log(`📄 ${files.length} archivos encontrados\n`);

  let totalChunks = 0;
  let totalInserted = 0;
  let totalFiles = 0;

  for (const file of files) {
    const filePath = path.join(DOCS_DIR, file);
    const relPath = `/docs/${file}`;

    console.log(`▸ ${file}`);
    let text = '';

    if (file.toLowerCase().endsWith('.pdf')) {
      text = await extractTextFromPdf(filePath);
    } else {
      text = fs.readFileSync(filePath, 'utf8');
    }

    if (!text.trim()) {
      console.log('  (sin contenido, saltando)\n');
      continue;
    }

    // Chunking
    const chunks = chunkText(text);
    console.log(`  ${chunks.length} chunks`);

    if (chunks.length === 0) continue;

    // Generar embeddings en batches
    let embeddings = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      try {
        const batchEmbeddings = await generateEmbeddings(batch);
        embeddings.push(...batchEmbeddings);
      } catch (err) {
        console.error(`  ✗ Error generando embeddings (batch ${i}):`, err.message);
        // Rellenar con vectores cero para mantener alineación
        embeddings.push(...batch.map(() => new Array(EMBEDDING_DIM).fill(0)));
      }
    }

    // Preparar registros
    const records = chunks.map((chunk, idx) => ({
      file_path: relPath,
      chunk_index: idx,
      chunk_content: chunk,
      metadata: {
        filename: file,
        chunk_total: chunks.length,
        char_count: chunk.length,
      },
      embedding: `[${embeddings[idx].join(',')}]`,
    }));

    // Insertar en Supabase
    const inserted = await insertChunks(records);
    totalChunks += chunks.length;
    totalInserted += inserted;
    totalFiles++;

    console.log(`  ✓ ${inserted}/${chunks.length} embeddings insertados\n`);

    // Pequeña pausa para no saturar la API
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('═══════════════════════════════════════════');
  console.log(`✅ Ingestión completada:`);
  console.log(`   Archivos: ${totalFiles}`);
  console.log(`   Chunks:   ${totalChunks}`);
  console.log(`   Embeddings insertados: ${totalInserted}`);
  console.log('═══════════════════════════════════════════');
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
