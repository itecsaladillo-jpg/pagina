import { DOCS_CONTEXT } from '../src/lib/docsContext';

const THRESHOLD_LOCAL    = 0.45;
const CHUNK_SIZE         = 900;
const CHUNK_OVERLAP      = 120;
const MAX_CONTEXT_CHARS  = 3200;

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

function calcularOverlap(tokensQuery: Set<string>, tokensChunk: Set<string>): number {
  if (tokensQuery.size === 0 || tokensChunk.size === 0) return 0
  let interseccion = 0
  for (const token of tokensQuery) {
    if (tokensChunk.has(token)) interseccion++
  }
  return interseccion / Math.min(tokensQuery.size, tokensChunk.size)
}

function dividirEnChunks(texto: string): string[] {
  const chunks: string[] = []
  let i = 0
  while (i < texto.length) {
    chunks.push(texto.slice(i, i + CHUNK_SIZE))
    i += CHUNK_SIZE - CHUNK_OVERLAP
  }
  return chunks
}

function encontrarMejorChunk(query: string, texto: string): { chunk: string; score: number, queryTokens: string[], chunkTokens: string[] } {
  const tokensQuery = tokenizar(query)
  const chunks = dividirEnChunks(texto)

  let mejorChunk = ''
  let mejorScore = 0
  let mejorChunkTokens: string[] = []

  for (const chunk of chunks) {
    const chunkTokens = tokenizar(chunk)
    const score = calcularOverlap(tokensQuery, chunkTokens)
    if (score > mejorScore) {
      mejorScore = score
      mejorChunk = chunk
      mejorChunkTokens = Array.from(chunkTokens)
    }
  }

  return { chunk: mejorChunk.trim(), score: mejorScore, queryTokens: Array.from(tokensQuery), chunkTokens: mejorChunkTokens }
}

const res = encontrarMejorChunk('que es la expo itec', DOCS_CONTEXT);
console.log('Query Tokens:', res.queryTokens);
console.log('Score:', res.score);
console.log('Chunk:', res.chunk.substring(0, 100));
