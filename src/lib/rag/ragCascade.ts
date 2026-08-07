/**
 * ragCascade.ts
 * Módulo de Recuperación de Contexto con Cascada de Prioridades — Asistente ITEC
 *
 *   P1 (score ≥ 0.20) → pgvector: búsqueda semántica en documents (Gemini text-embedding-004)
 *   P2 (score ≥ 0.40) → Documentos locales pre-parseados (DOCS_CONTEXT en memoria, keyword scoring)
 *   P3 (score ≥ 0.35) → Bucket Supabase Storage "training-docs"
 *   P4              → Conversaciones Guardadas (historial previo relevante)
 *   P5              → Web search (DuckDuckGo fallback)
 *   Soft fallback   → Mejor resultado encontrado aunque esté por debajo del threshold
 *
 * Nota de diseño: el contexto se inyecta sin etiquetas de fuente para que el LLM
 * no sepa de dónde proviene la información.
 */

import { DOCS_CONTEXT } from '@/lib/docsContext'
import type { SupabaseClient } from '@supabase/supabase-js'
import { buscarConversacionesSimilares } from './conversacionesGuardadas'

// ============================================================
// Configuración y thresholds
// ============================================================

const THRESHOLD_VECTOR    = 0.20   // Umbral bajo para no descartar info relevante (calibrado)
const THRESHOLD_LOCAL     = 0.40   // Umbral de confianza para docs locales (keyword)
const THRESHOLD_SUPABASE  = 0.35   // Umbral de confianza para bucket Supabase
const CHUNK_SIZE          = 900    // Tamaño de chunk en caracteres para scoring
const CHUNK_OVERLAP       = 120    // Solapamiento entre chunks
const MAX_CONTEXT_CHARS   = 3200   // Máximo de chars inyectados al prompt
const WEB_QUERY_SUFFIX    = 'itec saladillo Cicaré expo itec'

// ============================================================
// Scoring de relevancia — Overlap de tokens (estilo Jaccard)
// Compatible con Edge Runtime (sin dependencias Node.js)
// ============================================================

/**
 * Tokeniza texto normalizando diacríticos, minúsculas y descartando
 * palabras cortas o stopwords básicas del español.
 */
function tokenizar(texto: string): Set<string> {
  const STOPWORDS = new Set([
    'de','la','el','en','un','una','los','las','con','por','para','que',
    'del','al','se','es','son','fue','ser','estar','como','más','pero',
    'sus','les','has','este','esta','estos','estas','hay','sin','sur',
  ])
  return new Set(
    texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2 && !STOPWORDS.has(t))
  )
}

/**
 * Coeficiente de overlap: |A ∩ B| / min(|A|, |B|)
 * Más robusto que Jaccard para queries cortas vs. docs largos.
 */
function calcularOverlap(tokensQuery: Set<string>, tokensChunk: Set<string>): number {
  if (tokensQuery.size === 0 || tokensChunk.size === 0) return 0
  let interseccion = 0
  for (const token of tokensQuery) {
    if (tokensChunk.has(token)) interseccion++
  }
  return interseccion / Math.min(tokensQuery.size, tokensChunk.size)
}

/**
 * Divide un texto en chunks con solapamiento para no perder contexto
 * en los límites de corte.
 */
function dividirEnChunks(texto: string): string[] {
  const chunks: string[] = []
  let i = 0
  while (i < texto.length) {
    chunks.push(texto.slice(i, i + CHUNK_SIZE))
    i += CHUNK_SIZE - CHUNK_OVERLAP
  }
  return chunks
}

/**
 * Encuentra los chunks más relevantes para una query dada.
 * Retorna los mejores chunks y el score máximo.
 */
function encontrarMejoresChunks(query: string, texto: string, topK: number = 3): { chunks: string[]; maxScore: number } {
  const tokensQuery = tokenizar(query)
  const chunks = dividirEnChunks(texto)

  const chunkScores = chunks.map(chunk => ({
    chunk: chunk.trim(),
    score: calcularOverlap(tokensQuery, tokenizar(chunk))
  }))

  // Ordenar de mayor a menor score
  chunkScores.sort((a, b) => b.score - a.score)

  const mejores = chunkScores.slice(0, topK).filter(c => c.score > 0)

  return {
    chunks: mejores.map(m => m.chunk),
    maxScore: mejores.length > 0 ? mejores[0].score : 0
  }
}

// ============================================================
// P1 — Búsqueda Semántica pgvector (documents)
// ============================================================

/**
 * Busca contexto en la tabla documents usando pgvector.
 * Genera embedding de la query con Gemini text-embedding-004 y ejecuta
 * match_documents RPC para encontrar chunks similares por coseno.
 * Compatible con Edge Runtime (fetch nativo a Supabase REST + Gemini API).
 */
async function buscarEnVectorStore(
  query: string,
  supabase: SupabaseClient
): Promise<{ contexto: string; score: number }> {
  try {
    // Importar generarEmbedding dinámicamente para no romper Edge Runtime
    const { generarEmbedding } = await import('@/services/ai')
    const queryEmbedding = await generarEmbedding(query)
    
    if (!queryEmbedding || queryEmbedding.length === 0) {
      console.warn('[RAG P1] No se pudo generar embedding para la query')
      return { contexto: '', score: 0 }
    }

    // Formatear embedding como string para pgvector
    const embeddingStr = `[${queryEmbedding.join(',')}]`

    // Llamar a match_documents RPC
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embeddingStr,
      match_threshold: THRESHOLD_VECTOR,
      match_count: 6,
    })

    if (error) {
      console.error('[RAG P1] Error en match_documents RPC:', error.message)
      return { contexto: '', score: 0 }
    }

    if (!data || data.length === 0) {
      return { contexto: '', score: 0 }
    }

    // Concatenar los chunks más relevantes
    const contexto = data
      .map((r: any) => r.chunk_content)
      .join('\n...\n')
      .slice(0, MAX_CONTEXT_CHARS)

    const maxScore = Math.max(...data.map((r: any) => r.similarity))

    return { contexto, score: maxScore }
  } catch (err) {
    console.error('[RAG P1] Error en búsqueda vectorial:', err)
    return { contexto: '', score: 0 }
  }
}

// ============================================================
// P2 — Documentos Locales (DOCS_CONTEXT en memoria, keyword)
// ============================================================

/**
 * Busca contexto en los documentos locales pre-parseados.
 * No hace I/O; opera 100% en memoria → compatible con Edge Runtime.
 */
function buscarEnDocsLocales(query: string): { contexto: string; score: number } {
  try {
    const { chunks, maxScore } = encontrarMejoresChunks(query, DOCS_CONTEXT, 3)
    const contextoUnido = chunks.join('\n...\n')
    return {
      contexto: contextoUnido.slice(0, MAX_CONTEXT_CHARS),
      score: maxScore,
    }
  } catch (error) {
    console.error('[RAG P1] Error inesperado buscando en docs locales:', error)
    return { contexto: '', score: 0 }
  }
}

// ============================================================
// P3 — Supabase Storage Bucket
// ============================================================

/**
 * Lista y descarga los documentos de texto del bucket "training-docs".
 * Solo descarga .txt, .md y .json — ignora PDFs y binarios.
 * Implementado con fetch nativo para compatibilidad con Edge Runtime.
 */
async function obtenerTextoDesupabaseBucket(supabase: SupabaseClient): Promise<string> {
  const { data: archivos, error } = await supabase.storage
    .from('training-docs')
    .list('', { limit: 30, sortBy: { column: 'updated_at', order: 'desc' } })

  if (error || !archivos || archivos.length === 0) {
    if (error) console.warn('[RAG P2] Error al listar bucket training-docs:', error.message)
    return ''
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  
  const fetchPromises = archivos
    .filter(archivo => archivo.name.match(/\.(txt|md|json)$/i))
    .map(async (archivo) => {
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/training-docs/${encodeURIComponent(archivo.name)}`
      try {
        const res = await fetch(publicUrl, { signal: AbortSignal.timeout(4000) })
        if (!res.ok) return ''

        const texto = await res.text()

        if (archivo.name.endsWith('.json')) {
          try {
            const parsed = JSON.parse(texto) as Record<string, unknown>
            return typeof parsed.text === 'string' ? parsed.text : JSON.stringify(parsed)
          } catch {
            return texto
          }
        }
        return texto
      } catch (err) {
        console.warn(`[RAG P2] No se pudo descargar "${archivo.name}":`, err)
        return ''
      }
    })

  const textosArray = await Promise.all(fetchPromises)
  return textosArray.filter(t => t.length > 0).join('\n\n')
}

/**
 * Busca contexto en el bucket Supabase Storage.
 * Maneja errores de conexión de forma silenciosa para no romper la cascada.
 */
async function buscarEnSupabaseBucket(
  query: string,
  supabase: SupabaseClient
): Promise<{ contexto: string; score: number }> {
  const textoTotal = await obtenerTextoDesupabaseBucket(supabase)
  if (!textoTotal.trim()) return { contexto: '', score: 0 }

  const { chunks, maxScore } = encontrarMejoresChunks(query, textoTotal, 3)
  const contextoUnido = chunks.join('\n...\n')
  return { contexto: contextoUnido.slice(0, MAX_CONTEXT_CHARS), score: maxScore }
}

// ============================================================
// P5 — Web Search Fallback (DuckDuckGo Instant Answer)
// ============================================================

/**
 * Búsqueda vía DuckDuckGo Instant Answer API.
 * Sin API key requerida. Enriquece la query con términos del dominio ITEC.
 * Retorna AbstractText y hasta 3 RelatedTopics si están disponibles.
 */
async function buscarEnWeb(query: string): Promise<string> {
  const queryEnriquecida = `${query} ${WEB_QUERY_SUFFIX}`
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(queryEnriquecida)}&format=json&no_html=1&skip_disambig=1`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`DuckDuckGo error: ${res.status}`)

    const data = await res.json() as {
      AbstractText?: string
      RelatedTopics?: Array<{ Text?: string }>
    }

    const partes: string[] = []
    if (data.AbstractText) partes.push(data.AbstractText)

    for (const topic of (data.RelatedTopics ?? []).slice(0, 3)) {
      if (topic.Text) partes.push(topic.Text)
    }

    return partes.join('\n').slice(0, MAX_CONTEXT_CHARS)
  } catch (err) {
    console.warn('[RAG P3] DuckDuckGo falló:', err)
    return ''
  }
}

// ============================================================
// Orquestador principal — Cascada RAG
// ============================================================

export type NivelRAG = 'vector' | 'local' | 'supabase' | 'web' | 'conversaciones' | 'soft_fallback' | 'ninguno'

export interface RAGResult {
  /** Texto de contexto listo para inyectar al prompt (sin etiquetas de fuente). */
  contexto: string
  /** Nivel de la cascada que produjo el resultado (solo para logging interno). */
  nivel: NivelRAG
  /** Score de similitud [0–1]. 0 si vino de web search o soft fallback. */
  score: number
}

/**
 * Recupera el contexto más relevante para la query dada, siguiendo
 * la cascada de prioridades P1 → P2 → P3.
 *
 * El campo `nivel` en el resultado es SOLO para logging interno del servidor.
 * Nunca debe exponerse al LLM ni al cliente.
 *
 * @param query   - Mensaje del usuario
 * @param supabase - Cliente Supabase ya inicializado (desde el route handler)
 * @param sessionId - Opcional. ID de sesión para buscar en historial propio.
 */
export async function recuperarContextoRAG(
  query: string,
  supabase: SupabaseClient,
  sessionId?: string
): Promise<RAGResult> {
  // Guardamos el mejor resultado suave (por si todos fallan el threshold)
  let softBest: { contexto: string; score: number; nivel: NivelRAG } = {
    contexto: '',
    score: 0,
    nivel: 'ninguno',
  }

  // ── P1: Búsqueda Semántica pgvector ─────────────────────────
  try {
    const p1 = await buscarEnVectorStore(query, supabase)

    if (p1.score >= THRESHOLD_VECTOR && p1.contexto) {
      return { contexto: p1.contexto, nivel: 'vector', score: p1.score }
    }

    if (p1.score > softBest.score && p1.contexto) {
      softBest = { contexto: p1.contexto, score: p1.score, nivel: 'vector' }
    }
  } catch (err) {
    console.error('[RAG P1-vector] Error, pasando a P2:', err)
  }

  // ── P2: Documentos Locales (keyword scoring) ────────────────
  const p2 = buscarEnDocsLocales(query)

  if (p2.score >= THRESHOLD_LOCAL && p2.contexto) {
    return { contexto: p2.contexto, nivel: 'local', score: p2.score }
  }

  if (p2.score > softBest.score && p2.contexto) {
    softBest = { contexto: p2.contexto, score: p2.score, nivel: 'local' }
  }

  // ── P3: Supabase Storage Bucket ────────────────────────────
  try {
    const p3 = await buscarEnSupabaseBucket(query, supabase)

    if (p3.score >= THRESHOLD_SUPABASE && p3.contexto) {
      return { contexto: p3.contexto, nivel: 'supabase', score: p3.score }
    }

    if (p3.score > softBest.score && p3.contexto) {
      softBest = { contexto: p3.contexto, score: p3.score, nivel: 'supabase' }
    }
  } catch (err) {
    console.error('[RAG P3-supabase] Error en Supabase Storage, pasando a P4:', err)
  }

  // ── P4: Conversaciones Guardadas ───────────────────────────
  if (sessionId) {
    try {
      const p4_conv = await buscarConversacionesSimilares(query, sessionId, supabase)

      if (p4_conv.contexto) {
        return { contexto: p4_conv.contexto, nivel: 'conversaciones', score: p4_conv.score }
      }

      if (p4_conv.score > softBest.score && p4_conv.contexto) {
        softBest = { contexto: p4_conv.contexto, score: p4_conv.score, nivel: 'conversaciones' }
      }
    } catch (err) {
      console.error('[RAG P4-conv] Error buscando conversaciones:', err)
    }
  }

  // ── P5: Web Search Fallback ────────────────────────────────
  try {
    const webContexto = await buscarEnWeb(query)

    if (webContexto) {
      return { contexto: webContexto, nivel: 'web', score: 0 }
    }
  } catch (err) {
    console.error('[RAG P5-web] Error en búsqueda web:', err)
  }

  // ── Soft Fallback: mejor resultado aunque esté bajo el threshold ──
  if (softBest.contexto) {
    console.warn(`[RAG] Usando soft fallback (${softBest.nivel}, score=${softBest.score.toFixed(3)})`)
    return { contexto: softBest.contexto, nivel: 'soft_fallback', score: softBest.score }
  }

  console.warn('[RAG] Sin contexto recuperado en ningún nivel.')
  return { contexto: '', nivel: 'ninguno', score: 0 }
}
