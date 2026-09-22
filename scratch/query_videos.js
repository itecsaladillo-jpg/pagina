const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY no están configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    const { data: videos, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    console.log(`\n=== LISTADO COMPACTO DE VIDEOS (${videos.length} en total) ===`);
    videos.forEach((video, index) => {
      console.log(`#${index + 1} - ${video.title} [Creado el: ${video.created_at}] - Activo: ${video.is_active}`);
    });

    console.log(`\n=== DETALLE DE LOS 6 VIDEOS MÁS RECIENTES ===`);
    const masRecientes = videos.slice(0, 6);
    masRecientes.forEach((video, index) => {
      console.log(`----------------------------------------`);
      console.log(`Video #${index + 1} más reciente`);
      console.log(`ID: ${video.id}`);
      console.log(`Título: ${video.title}`);
      console.log(`Descripción: ${video.description}`);
      console.log(`Resumen IA: ${video.ai_summary}`);
      console.log(`URL YouTube: ${video.youtube_url}`);
      console.log(`Creado el: ${video.created_at}`);
      console.log(`Activo: ${video.is_active}`);
      console.log(`Orden: ${video.display_order}`);
    });
    console.log(`----------------------------------------\n`);
  } catch (error) {
    console.error('Error al consultar videos:', error);
  }
}

run();
