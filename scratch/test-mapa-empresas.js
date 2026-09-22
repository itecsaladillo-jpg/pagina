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
  console.log('Querying one row from mapa_empresas...');
  
  const { data, error } = await supabase
    .from('mapa_empresas')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Successfully queried! Row data:');
    console.log(data);
    if (data && data.length > 0) {
      console.log('Keys/Columns available:');
      console.log(Object.keys(data[0]));
    } else {
      console.log('No rows returned, but table exists and query succeeded.');
    }
  }
}

run();
