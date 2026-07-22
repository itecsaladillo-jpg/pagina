const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: news } = await supabase
    .from('news_flashes')
    .select('*')
    .ilike('titulo', '%Huertas comunitarias%');
  
  console.log('--- news_flashes ---');
  console.log(JSON.stringify(news, null, 2));

  if (news && news.length > 0) {
    const id = news[0].id;

    const { data: notas } = await supabase
      .from('notas_publico')
      .select('*')
      .eq('news_flash_id', id);
    console.log('\n--- notas_publico ---');
    console.log(JSON.stringify(notas, null, 2));

    const { data: articles } = await supabase
      .from('public_articles')
      .select('*')
      .eq('news_flash_id', id);
    console.log('\n--- public_articles ---');
    console.log(JSON.stringify(articles, null, 2));
  } else {
    // Check maybe in public_articles directly by title?
    const { data: articles } = await supabase
      .from('public_articles')
      .select('*')
      .ilike('title', '%Huertas comunitarias%');
    console.log('\n--- public_articles (by title) ---');
    console.log(JSON.stringify(articles, null, 2));
  }
}
check();
