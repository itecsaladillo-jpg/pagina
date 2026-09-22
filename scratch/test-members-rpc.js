const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ooqosswidezaexqyebqa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcW9zc3dpZGV6YWV4cXllYnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyODI2MDQsImV4cCI6MjA5Mzg1ODYwNH0.liGGoO5yxRbHIXF96iiSA8Igw0uVaVYWE7v7dcbjky4';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function run() {
  console.log('Calling rpc("obtener_miembros_publicos")...');
  
  const { data, error } = await supabase.rpc('obtener_miembros_publicos');

  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('RPC Success! Data received:');
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
