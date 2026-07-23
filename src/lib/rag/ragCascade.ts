/**
 * ragCascade.ts
 * Módulo de Recuperación de Contexto con Cascada de Prioridades — Asistente ITEC
 *
 * Flujo:
 *   P1 (score ≥ 0.45) → Documentos locales pre-parseados (DOCS_CONTEXT en memoria)
 *   P2 (score ≥ 0.40) → Bucket Supabase Storage "training-docs"
 *   P3              → Web search (Serper.dev → DuckDuckGo fallback)
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

const THRESHOLD_LOCAL    = 0.45   // Umbral de confianza para docs locales
const THRESHOLD_SUPABASE = 0.40   // Umbral de confianza para bucket Supabase
const CHUNK_SIZE         = 900    // Tamaño de chunk en caracteres para scoring
const CHUNK_OVERLAP      = 120    // Solapamiento entre chunks
const MAX_CONTEXT_CHARS  = 3200   // Máximo de chars inyectados al prompt
const WEB_QUERY_SUFFIX   = 'itec saladillo Cicaré expo itec'

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
// P1 — Documentos Locales (DOCS_CONTEXT en memoria)
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
// P2 — Supabase Storage Bucket (training-docs)
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
  const textos: string[] = []

  for (const archivo of archivos) {
    if (!archivo.name.match(/\.(txt|md|json)$/i)) continue

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/training-docs/${encodeURIComponent(archivo.name)}`
    try {
      const res = await fetch(publicUrl, { signal: AbortSignal.timeout(4000) })
      if (!res.ok) continue

      const texto = await res.text()

      if (archivo.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(texto) as Record<string, unknown>
          // Soporta tanto { text: "..." } como cualquier formato plano
          textos.push(typeof parsed.text === 'string' ? parsed.text : JSON.stringify(parsed))
        } catch {
          textos.push(texto)
        }
      } else {
        textos.push(texto)
      }
    } catch (err) {
      console.warn(`[RAG P2] No se pudo descargar "${archivo.name}":`, err)
    }
  }

  return textos.join('\n\n')
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
// P3 — Web Search Fallback (DuckDuckGo Instant Answer)
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

export type NivelRAG = 'local' | 'supabase' | 'web' | 'conversaciones' | 'soft_fallback' | 'ninguno'

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

  // ── P1: Documentos Locales ─────────────────────────────────
  const p1 = buscarEnDocsLocales(query)
  console.log(`[RAG P1] score=${p1.score.toFixed(3)} threshold=${THRESHOLD_LOCAL}`)

  if (p1.score >= THRESHOLD_LOCAL && p1.contexto) {
    return { contexto: p1.contexto, nivel: 'local', score: p1.score }
  }

  // Actualizar soft best si mejoró
  if (p1.score > softBest.score && p1.contexto) {
    softBest = { contexto: p1.contexto, score: p1.score, nivel: 'local' }
  }

  // ── P2: Supabase Storage Bucket ────────────────────────────
  try {
    const p2 = await buscarEnSupabaseBucket(query, supabase)
    console.log(`[RAG P2] score=${p2.score.toFixed(3)} threshold=${THRESHOLD_SUPABASE}`)

    if (p2.score >= THRESHOLD_SUPABASE && p2.contexto) {
      return { contexto: p2.contexto, nivel: 'supabase', score: p2.score }
    }

    if (p2.score > softBest.score && p2.contexto) {
      softBest = { contexto: p2.contexto, score: p2.score, nivel: 'supabase' }
    }
  } catch (err) {
    console.error('[RAG P2] Error en Supabase Storage, pasando a P3:', err)
  }

  // ── P3: Web Search Fallback ────────────────────────────────
  try {
    const webContexto = await buscarEnWeb(query)
    console.log(`[RAG P3] ${webContexto ? `${webContexto.length} chars recuperados` : 'sin resultados'}`)

    if (webContexto) {
      return { contexto: webContexto, nivel: 'web', score: 0 }
    }
  } catch (err) {
    console.error('[RAG P3] Error en búsqueda web:', err)
  }

  // ── P4: Conversaciones Guardadas ───────────────────────────
  if (sessionId) {
    try {
      const p4 = await buscarConversacionesSimilares(query, sessionId, supabase)
      console.log(`[RAG P4] score=${p4.score.toFixed(3)} (threshold=0.35)`)

      // El umbral (0.35) ya se aplica en buscarConversacionesSimilares (RPC),
      // por lo que si retorna contexto, asumimos que superó la relevancia mínima.
      if (p4.contexto) {
        return { contexto: p4.contexto, nivel: 'conversaciones', score: p4.score }
      }

      if (p4.score > softBest.score && p4.contexto) {
        softBest = { contexto: p4.contexto, score: p4.score, nivel: 'conversaciones' }
      }
    } catch (err) {
      console.error('[RAG P4] Error buscando conversaciones:', err)
    }
  }

  // ── Soft Fallback: mejor resultado aunque esté bajo el threshold ──
  if (softBest.contexto) {
    console.warn(`[RAG] Usando soft fallback (${softBest.nivel}, score=${softBest.score.toFixed(3)})`)
    return { contexto: softBest.contexto, nivel: 'soft_fallback', score: softBest.score }
  }

  console.warn('[RAG] Sin contexto recuperado en ningún nivel.')
  return { contexto: '', nivel: 'ninguno', score: 0 }
}
