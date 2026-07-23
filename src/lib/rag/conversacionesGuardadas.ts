/**
 * conversacionesGuardadas.ts
 * Persistencia y recuperación semántica de conversaciones — P4 de la cascada RAG
 *
 * Responsabilidades:
 *   - Detectar comandos explícitos de guardado en el mensaje del usuario.
 *   - Decidir si corresponde un auto-guardado por umbral de longitud.
 *   - Generar el embedding del historial y persistirlo en Supabase.
 *   - Buscar conversaciones pasadas similares a la query actual (P4).
 *
 * Compatible con Edge Runtime: usa fetch nativo, sin dependencias Node.js.
 */

import { generarEmbedding } from '@/services/ai'
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================
// Configuración
// ============================================================

/** Mínimo de mensajes en el historial para activar el auto-guardado. */
export const AUTO_SAVE_THRESHOLD = 10

/**
 * Cada cuántos mensajes (después del threshold) se vuelve a guardar
 * automáticamente. Evita guardar en cada request una vez superado el umbral.
 */
export const AUTO_SAVE_INTERVAL = 10

/** Umbral de similitud para recuperar una conversación guardada (P4). */
const THRESHOLD_P4 = 0.35

/** Máximo de mensajes del final del historial que se formatean para el embedding. */
const MAX_HISTORIAL_EMBED = 20

/** Máximo de chars del texto formateado que se almacena como resumen. */
const MAX_RESUMEN_CHARS = 2000

/** Máximo de chars del contexto recuperado de conversaciones pasadas. */
const MAX_CONTEXT_CHARS = 2400

// ============================================================
// Detección de comando de guardado
// ============================================================

/**
 * Patrones de comando explícito de guardado en español rioplatense.
 * Cubre variantes con y sin tilde, con distintas palabras clave.
 */
const SAVE_PATTERNS: RegExp[] = [
  /guard[aá]r?\s+(esta\s+)?conversaci[oó]n/i,
  /guard[aá]\s+(esto|esta\s+charla|este\s+chat|esta\s+sesi[oó]n)/i,
  /guard[aá]\s+nuestra\s+conversaci[oó]n/i,
  /guard[aá]\s+(el\s+)?historial/i,
  /registr[aá]\s+(esta\s+)?(conversaci[oó]n|charla|chat|sesi[oó]n)/i,
  /persist[ií]\s+(esta\s+)?conversaci[oó]n/i,
  /guard[aá]\s+esto/i,
  /anot[aá]\s+(esta\s+)?conversaci[oó]n/i,
]

/**
 * Retorna `true` si el mensaje del usuario contiene un comando explícito
 * de guardar la conversación.
 */
export function detectarComandoGuardar(mensaje: string): boolean {
  return SAVE_PATTERNS.some(pattern => pattern.test(mensaje))
}

/**
 * Retorna `true` si el historial supera el umbral de auto-guardado
 * Y es un múltiplo del intervalo de guardado (para no guardar en cada turno).
 */
export function debeAutoGuardar(historialLength: number): boolean {
  return (
    historialLength >= AUTO_SAVE_THRESHOLD &&
    historialLength % AUTO_SAVE_INTERVAL === 0
  )
}

// ============================================================
// Formateo del historial para embedding
// ============================================================

type Mensaje = { role: string; content: string }

/**
 * Toma los últimos N mensajes del historial y los formatea como texto
 * legible para generar el embedding. Se usa también como resumen almacenado.
 */
function formatearHistorialParaEmbedding(historial: Mensaje[]): string {
  return historial
    .slice(-MAX_HISTORIAL_EMBED)
    .map(m => {
      const rol = m.role === 'user' ? 'Usuario' : 'Asistente'
      return `${rol}: ${m.content}`
    })
    .join('\n')
    .slice(0, MAX_RESUMEN_CHARS)
}

// ============================================================
// Guardado de conversación
// ============================================================

/**
 * Genera el embedding del historial y persiste la conversación en Supabase.
 * Retorna `true` si el guardado fue exitoso.
 *
 * Diseñado para ejecutarse de forma fire-and-forget (no bloquea la respuesta).
 *
 * @param historial  - Array completo de mensajes incluyendo el turno actual
 * @param sessionId  - UUID de sesión generado por el cliente
 * @param supabase   - Cliente Supabase inicializado
 * @param guardadoManualmente - `true` si fue disparado por comando explícito
 */
export async function guardarConversacion(
  historial: Mensaje[],
  sessionId: string,
  supabase: SupabaseClient,
  guardadoManualmente = false
): Promise<boolean> {
  if (historial.length < 2) {
    console.warn('[GuardarConversacion] Historial demasiado corto para guardar.')
    return false
  }

  try {
    const textoFormateado = formatearHistorialParaEmbedding(historial)
    const embedding = await generarEmbedding(textoFormateado)

    if (embedding.length === 0) {
      console.error('[GuardarConversacion] No se pudo generar el embedding — guardado cancelado.')
      return false
    }

    const { error } = await supabase
      .from('saved_conversations')
      .insert({
        session_id:           sessionId,
        resumen:              textoFormateado,
        embedding,
        historial,
        turno_count:          Math.floor(historial.length / 2),
        guardado_manualmente: guardadoManualmente,
      })

    if (error) {
      console.error('[GuardarConversacion] Error en Supabase insert:', error.message)
      return false
    }

    console.log(
      `[GuardarConversacion] ✓ Guardado (${historial.length} msgs,` +
      ` turnos=${Math.floor(historial.length / 2)},` +
      ` manual=${guardadoManualmente})`
    )
    return true
  } catch (err) {
    console.error('[GuardarConversacion] Error inesperado:', err)
    return false
  }
}

// ============================================================
// Búsqueda en conversaciones guardadas (P4)
// ============================================================

/**
 * Busca conversaciones guardadas similares a la query actual usando
 * similitud coseno sobre los embeddings almacenados.
 *
 * Solo busca dentro de la sesión del usuario (`sessionId`) para que
 * cada usuario recupere únicamente su propia memoria.
 *
 * @param query     - Mensaje actual del usuario
 * @param sessionId - UUID de sesión del cliente
 * @param supabase  - Cliente Supabase inicializado
 */
export async function buscarConversacionesSimilares(
  query: string,
  sessionId: string,
  supabase: SupabaseClient
): Promise<{ contexto: string; score: number }> {
  const embedding = await generarEmbedding(query)

  if (embedding.length === 0) {
    console.warn('[RAG P4] No se pudo generar embedding para la query.')
    return { contexto: '', score: 0 }
  }

  const { data, error } = await supabase.rpc('buscar_conversaciones_similares', {
    query_embedding:      embedding,
    p_session_id:         sessionId,
    similarity_threshold: THRESHOLD_P4,
    match_count:          3,
  })

  if (error) {
    console.warn('[RAG P4] Error en RPC buscar_conversaciones_similares:', error.message)
    return { contexto: '', score: 0 }
  }

  if (!data || data.length === 0) {
    return { contexto: '', score: 0 }
  }

  type ConversacionRow = { id: string; resumen: string; turno_count: number; similarity: number }
  const rows = data as ConversacionRow[]

  const mejorScore = rows[0].similarity
  const contexto = rows
    .map(r => r.resumen)
    .join('\n---\n')
    .slice(0, MAX_CONTEXT_CHARS)

  console.log(`[RAG P4] ${rows.length} conversación(es) recuperada(s), score=${mejorScore.toFixed(3)}`)
  return { contexto, score: mejorScore }
}
