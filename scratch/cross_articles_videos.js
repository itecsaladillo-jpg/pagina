const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const [{ data: articles, error: e1 }, { data: videos, error: e2 }] = await Promise.all([
    supabase.from('public_articles').select('id, title, slug, content, excerpt').eq('is_published', true),
    supabase.from('videos').select('id, title, youtube_url').eq('is_active', true),
  ]);

  if (e1) { console.error('Error artículos:', e1); process.exit(1); }
  if (e2) { console.error('Error videos:', e2); process.exit(1); }

  console.log('\n=== ARTÍCULOS PUBLICADOS (' + articles.length + ') ===');
  articles.forEach((a, i) => {
    console.log(`\n#${i+1} ID: ${a.id}`);
    console.log(`   Título: ${a.title}`);
    console.log(`   Slug: ${a.slug}`);
    console.log(`   Excerpt: ${a.excerpt}`);
    console.log(`   Contenido (primeros 150 chars): ${(a.content || '').slice(0, 150)}...`);
  });

  console.log('\n=== VIDEOS ACTIVOS (' + videos.length + ') ===');
  videos.forEach((v, i) => {
    console.log(`#${i+1} ID: ${v.id} | Título: ${v.title}`);
  });
}

run();
