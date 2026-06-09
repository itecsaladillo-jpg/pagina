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
  console.log('Testing connection and inserting dummy record into "asistente_feedback"...');
  
  const { data, error } = await supabase
    .from('asistente_feedback')
    .insert({
      historial: [{ role: 'user', text: 'hola' }],
      calificacion: 'muy_util',
      comentario: 'Prueba de diagnóstico',
      tema_principal: 'Prueba tema',
      lo_mas_util: 'Prueba utilidad',
      embedding: null
    });

  if (error) {
    console.error('Database Error inserting into asistente_feedback:', error);
  } else {
    console.log('Successfully inserted into asistente_feedback! Data:', data);
  }
}

run();
