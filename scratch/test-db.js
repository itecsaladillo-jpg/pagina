const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
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

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data: actions, error: actError } = await supabase
    .from('itec_actions')
    .select('id')
    .limit(1);

  if (actError || !actions || actions.length === 0) {
    console.log('No active events found or error fetching events:', actError);
    return;
  }

  const validEventId = actions[0].id;
  console.log('Testing insert with valid event ID (no select):', validEventId);

  const { error } = await supabase
    .from('evento_preguntas')
    .insert([{
      evento_id: validEventId,
      nombre: 'Test Anónimo',
      pregunta: '¿Esta es una pregunta de prueba sin select?',
      aprobada: false
    }]);
  console.log('Insert test result without select:', error);
}

test();
