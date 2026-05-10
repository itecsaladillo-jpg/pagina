import { getNewsFlashes, getPublicArticles } from '@/services/news'
import { getPublicActions } from '@/services/actions'
import { ImpactSectionClient } from './ImpactSectionClient'

export async function ImpactSection() {
  const [news, actions, articles] = await Promise.all([
    getNewsFlashes(),
    getPublicActions(),
    getPublicArticles()
  ])

  return (
    <ImpactSectionClient 
      news={JSON.parse(JSON.stringify(news))} 
      actions={JSON.parse(JSON.stringify(actions))} 
      articles={JSON.parse(JSON.stringify(articles))} 
    />
  )
}
