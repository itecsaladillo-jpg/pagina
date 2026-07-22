import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
  const { data, error } = await supabase
    .from('notas_publico')
    .select('*, news_flashes(media_urls)')
    .eq('titulo', 'Huertas comunitarias impulsan soberanía alimentaria');
  
  console.log(JSON.stringify(data, null, 2));
}

main();
