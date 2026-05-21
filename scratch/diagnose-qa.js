const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Leer variables de entorno desde .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  console.error("No se pudo leer .env.local:", e.message);
  process.exit(1);
}

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan variables de Supabase en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose() {
  console.log("=== DIAGNÓSTICO DEL SISTEMA DE PREGUNTAS EN VIVO ===");
  console.log("Supabase URL:", supabaseUrl);
  
  // 1. Obtener eventos (itec_actions)
  const { data: eventos, error: evError } = await supabase
    .from('itec_actions')
    .select('id, title, status')
    .order('created_at', { ascending: false });

  if (evError) {
    console.error("❌ Error al consultar eventos (itec_actions):", evError.message);
    return;
  }

  console.log(`\n📅 Eventos registrados (${eventos.length}):`);
  eventos.forEach(ev => {
    console.log(`   - ID: ${ev.id} | Título: "${ev.title}" | Estado: ${ev.status}`);
  });

  // 2. Obtener preguntas generales
  const { data: preguntas, error: prError } = await supabase
    .from('evento_preguntas')
    .select('id, evento_id, nombre, pregunta, aprobada, created_at')
    .order('created_at', { ascending: false });

  if (prError) {
    console.error("❌ Error al consultar preguntas (evento_preguntas):", prError.message);
    return;
  }

  console.log(`\n💬 Preguntas en la base de datos (${preguntas.length}):`);
  if (preguntas.length === 0) {
    console.log("   ⚠️ No hay NINGUNA pregunta registrada en toda la tabla.");
  } else {
    preguntas.slice(0, 10).forEach(pr => {
      const eventName = eventos.find(e => e.id === pr.evento_id)?.title || "Evento Desconocido";
      console.log(`   - ID: ${pr.id}`);
      console.log(`     Evento: "${eventName}" (ID: ${pr.evento_id})`);
      console.log(`     Autor: ${pr.nombre} | Aprobada: ${pr.aprobada}`);
      console.log(`     Pregunta: "${pr.pregunta}"`);
      console.log(`     Creado: ${pr.created_at}`);
    });
    if (preguntas.length > 10) {
      console.log(`   ... y ${preguntas.length - 10} preguntas más.`);
    }
  }

  // 3. Obtener miembros (public.members)
  const { data: miembros, error: mbError } = await supabase
    .from('members')
    .select('id, full_name, email, role, status');

  if (mbError) {
    console.error("❌ Error al consultar miembros (members):", mbError.message);
    return;
  }

  console.log(`\n👥 Miembros en la base de datos (${miembros.length}):`);
  miembros.forEach(mb => {
    console.log(`   - Nombre: ${mb.full_name} | Email: ${mb.email} | Rol: ${mb.role} | Estado: ${mb.status}`);
  });
}

diagnose();
