import { NextRequest, NextResponse } from 'next/server'

/**
 * Gate de seguridad para endpoints de diagnóstico (ago 2026).
 *
 * Antes: /api/asistente/debug y /api/asistente/test eran públicos y exponían
 * prefijos de API keys (12 chars) + ejecutaban llamadas reales a providers
 * sin autenticación (abuso de créditos garantizado si se descubría la URL).
 *
 * Ahora solo se permite:
 *  - Fuera de producción (desarrollo local), o
 *  - En producción SOLO con el secreto correcto en header `x-diag-key`
 *    (configurar DIAG_SECRETO en las env vars de Vercel).
 *
 * Uso en producción: curl -H "x-diag-key: $DIAG_SECRETO" .../api/asistente/debug
 */
export function verificarAccesoDiagnostico(req: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== 'production') return null

  const secreto = process.env.DIAG_SECRETO
  const provisto = req.headers.get('x-diag-key')

  if (secreto && provisto === secreto) return null

  // Sin secreto configurado o incorrecto → 404 (no revelar que el endpoint existe)
  return NextResponse.json({ error: 'Not Found' }, { status: 404 })
}
