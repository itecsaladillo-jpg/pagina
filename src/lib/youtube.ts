/**
 * Utilidades para parsing, extracción de IDs y armado de URLs
 * de incrustación (anti-branding) para YouTube.
 */

/**
 * Extrae el VIDEO_ID o LIVE_ID (11 caracteres) de diversas variantes de URLs de YouTube
 * o retorna el ID si ya fue provisto directamente.
 *
 * Formatos soportados:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/live/LIVE_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - Enlaces con parámetros adicionales (?si=..., &t=..., etc.)
 * - Strings directos de 11 caracteres (ID puro)
 */
export function extractYouTubeId(urlOrId: string | null | undefined): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null
  const trimmed = urlOrId.trim()
  if (!trimmed) return null

  // Si ya es un ID de 11 caracteres alfanuméricos directos
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed
  }

  try {
    const urlString = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`

    const parsed = new URL(urlString)

    // Dominios youtube.com (desktop, mobile, etc.)
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.searchParams.has('v')) {
        const id = parsed.searchParams.get('v')
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id
      }
      if (parsed.pathname.includes('/live/')) {
        const id = parsed.pathname.split('/live/')[1]?.split('/')[0]?.split('?')[0]
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id
      }
      if (parsed.pathname.includes('/embed/')) {
        const id = parsed.pathname.split('/embed/')[1]?.split('/')[0]?.split('?')[0]
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id
      }
      if (parsed.pathname.includes('/v/')) {
        const id = parsed.pathname.split('/v/')[1]?.split('/')[0]?.split('?')[0]
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id
      }
      if (parsed.pathname.includes('/shorts/')) {
        const id = parsed.pathname.split('/shorts/')[1]?.split('/')[0]?.split('?')[0]
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id
      }
    }

    // youtu.be
    if (parsed.hostname === 'youtu.be' || parsed.hostname.endsWith('.youtu.be')) {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0]?.split('?')[0]
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id
    }

    // Fallback de expresión regular robusta
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|live\/|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i
    const match = trimmed.match(regex)
    if (match && match[1]) {
      return match[1]
    }

    return null
  } catch {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|live\/|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i
    const match = trimmed.match(regex)
    return match && match[1] ? match[1] : null
  }
}

/**
 * Valida si un string corresponde a una URL o ID de YouTube válido.
 */
export function isValidYouTubeUrl(url: string | null | undefined): boolean {
  return extractYouTubeId(url) !== null
}

/**
 * Construye la URL de incrustación de YouTube aplicando las directivas
 * Anti-Branding obligatorias:
 * - modestbranding=1 (Reduce logo en barra de controles)
 * - rel=0 (Restringe videos recomendados al mismo canal)
 * - iv_load_policy=3 (Oculta anotaciones e interactividad sobre el video)
 * - enablejsapi=1 (Permite control por API JS)
 * - autoplay=1 & mute=1 (Inicia la reproducción inmediata sin bloqueo de audio en navegadores)
 */
export function buildYouTubeEmbedUrl(
  videoIdOrUrl: string,
  options: { autoplay?: boolean; mute?: boolean } = {}
): string | null {
  const videoId = extractYouTubeId(videoIdOrUrl)
  if (!videoId) return null

  const { autoplay = true, mute = true } = options
  const params = new URLSearchParams({
    modestbranding: '1',
    rel: '0',
    iv_load_policy: '3',
    enablejsapi: '1',
  })

  if (autoplay) params.set('autoplay', '1')
  if (mute) params.set('mute', '1')

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}
