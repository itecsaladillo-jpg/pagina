import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: No se encontraron credenciales de Supabase.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function obtenerContexto() {
  console.log("=== CONTEXTO DINÁMICO DE ITEC (TIEMPO REAL) ===\n");

  const { data: news } = await supabase
    .from('news_flashes')
    .select('titulo, is_published, summary, source_type')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log("ÚLTIMOS COMUNICADOS Y NOTICIAS EN LA BASE DE DATOS:");
  if (news && news.length > 0) {
    news.forEach(n => {
      console.log(`\n📌 [${n.is_published ? 'PUBLICADO' : 'BORRADOR'}] ${n.titulo}`);
      console.log(`   Tipo: ${n.source_type || 'Desconocido'}`);
      console.log(`   Resumen: ${n.summary || 'Sin resumen'}`);
    });
  } else {
    console.log("- No hay noticias recientes.");
  }
  
  // Agregar también las acciones si existieran a futuro
  const { data: actions } = await supabase
    .from('itec_actions')
    .select('title, status, type')
    .order('created_at', { ascending: false })
    .limit(3);
    
  console.log("\nÚLTIMAS ACCIONES INSTITUCIONALES:");
  if (actions && actions.length > 0) {
    actions.forEach(a => console.log(`- [${a.status}] ${a.title} (${a.type})`));
  } else {
    console.log("- No hay acciones institucionales recientes registradas aún.");
  }
}

obtenerContexto();
