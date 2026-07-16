import { getPublicArticles } from '@/services/news'
import { getPublicActions } from '@/services/actions'
import { ImpactSectionClient } from './ImpactSectionClient'

export async function ImpactSection() {
  const [actions, articles] = await Promise.all([
    getPublicActions(),
    getPublicArticles()
  ])

  return (
    <ImpactSectionClient 
      news={[]} 
      actions={JSON.parse(JSON.stringify(actions))} 
      articles={JSON.parse(JSON.stringify(articles))} 
    />
  )
}
