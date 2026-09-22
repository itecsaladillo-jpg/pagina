const https = require('https');

const supabaseUrl = 'https://ooqosswidezaexqyebqa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcW9zc3dpZGV6YWV4cXllYnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyODI2MDQsImV4cCI6MjA5Mzg1ODYwNH0.liGGoO5yxRbHIXF96iiSA8Igw0uVaVYWE7v7dcbjky4';

// Endpoint público para obtener información del bucket 'avatars'
const url = `${supabaseUrl}/storage/v1/bucket/avatars`;

https.get(url, {
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code for /bucket/avatars:', res.statusCode);
    try {
      const payload = JSON.parse(data);
      console.log('Response Payload:', payload);
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
}).on('error', (err) => {
  console.error('Request error:', err);
});
