import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://ooqosswidezaexqyebqa.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcW9zc3dpZGV6YWV4cXllYnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyODI2MDQsImV4cCI6MjA5Mzg1ODYwNH0.liGGoO5yxRbHIXF96iiSA8Igw0uVaVYWE7v7dcbjky4"
);

async function checkColumns() {
  const { data, error } = await supabase
    .from('public_articles')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error(error);
  } else if (data && data.length > 0) {
    console.log("Columns found:", Object.keys(data[0]));
  } else {
    console.log("No data found in public_articles to check columns.");
  }
}

checkColumns();
