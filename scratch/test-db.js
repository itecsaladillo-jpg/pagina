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

async function test() {
  const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
  const response = await fetch(url);
  const schema = await response.json();
  console.log('PostgREST response:', schema);
}

test();
