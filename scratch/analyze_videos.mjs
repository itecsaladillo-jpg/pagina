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

  console.log('Videos analysis:')
  data.forEach(v => {
    const isYoutube = v.youtube_url.includes('youtube.com') || v.youtube_url.includes('youtu.be')
    const hasThumbnail = v.thumbnail_url && !v.thumbnail_url.includes('cicare-1.jpg') && !v.thumbnail_url.includes('cicare-3.jpg')
    
    console.log(`- Title: ${v.title}`)
    console.log(`  URL: ${v.youtube_url} [${isYoutube ? 'OK' : 'NOT YOUTUBE'}]`)
    console.log(`  Thumbnail: ${v.thumbnail_url} [${hasThumbnail ? 'OK' : 'MISSING/BROKEN'}]`)
    console.log(`  Active: ${v.is_active}`)
    console.log('---')
  })
}

checkVideos()
