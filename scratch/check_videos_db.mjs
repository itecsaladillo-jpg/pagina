import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkVideos() {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching videos:', error)
    return
  }

  console.log('Videos in database:')
  data.forEach(v => {
    console.log(`- ID: ${v.id}`)
    console.log(`  Title: ${v.title}`)
    console.log(`  URL: ${v.youtube_url}`)
    console.log(`  Thumbnail: ${v.thumbnail_url}`)
    console.log(`  Summary: ${v.ai_summary ? 'Yes' : 'No'}`)
    console.log('---')
  })
}

checkVideos()
