const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ooqosswidezaexqyebqa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcW9zc3dpZGV6YWV4cXllYnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyODI2MDQsImV4cCI6MjA5Mzg1ODYwNH0.liGGoO5yxRbHIXF96iiSA8Igw0uVaVYWE7v7dcbjky4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching members:', error);
  } else {
    console.log('Fields in members table:', data ? Object.keys(data[0] || {}) : 'No data');
    console.log('Sample record:', data ? data[0] : 'No data');
  }
}

run();
