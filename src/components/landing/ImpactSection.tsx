import { getPublicArticles, getAllMulticanalNewsFlashes } from '@/services/news'
import { getPublicActions } from '@/services/actions'
import { ImpactSectionClient } from './ImpactSectionClient'

export async function ImpactSection() {
  const [actions, articles, multicanalFlashes] = await Promise.all([
    getPublicActions(),
    getPublicArticles(),
    getAllMulticanalNewsFlashes()
  ])

  // Filtrar solo las noticias públicas y mapearlas al formato esperado
  const publicFlashes = multicanalFlashes
    .filter(f => f.para_publico && f.is_published !== false)
    .map(f => ({
      id: f.id,
      title: f.titulo,
      content: f.texto_publico || f.flash_text || '',
      excerpt: 'NOTICIA',
      created_at: f.created_at,
      media_urls: f.media_urls || [],
      related_video: null
    }))

  // Combinar los artículos legados con las noticias multicanales
  const allArticles = [...articles, ...publicFlashes]

  // Deduplicar por título exacto para evitar duplicados si algo está en ambas tablas
  const uniqueArticles = Array.from(new Map(allArticles.map(a => [a.title?.trim(), a])).values())

  return (
    <ImpactSectionClient 
      news={[]} 
      actions={JSON.parse(JSON.stringify(actions))} 
      articles={JSON.parse(JSON.stringify(uniqueArticles))} 
    />
  )
}
