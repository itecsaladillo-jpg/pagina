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
    const { data: actions, error } = await supabase
      .from('itec_actions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    console.log(`\n=== ACCIONES EN ITEC (${actions.length} en total) ===`);
    actions.forEach((action, index) => {
      console.log(`----------------------------------------`);
      console.log(`Acción #${index + 1}`);
      console.log(`ID: ${action.id}`);
      console.log(`Título: ${action.title}`);
      console.log(`Descripción: ${action.description}`);
      console.log(`Tipo: ${action.type}`);
      console.log(`Estado: ${action.status}`);
      console.log(`Creado el: ${action.created_at}`);
      console.log(`Tags: ${action.tags}`);
    });
    console.log(`----------------------------------------\n`);
  } catch (error) {
    console.error('Error al consultar acciones:', error);
  }
}

run();
