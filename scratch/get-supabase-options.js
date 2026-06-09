const https = require('https');

const supabaseUrl = 'https://ooqosswidezaexqyebqa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcW9zc3dpZGV6YWV4cXllYnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyODI2MDQsImV4cCI6MjA5Mzg1ODYwNH0.liGGoO5yxRbHIXF96iiSA8Igw0uVaVYWE7v7dcbjky4';

const url = `${supabaseUrl}/rest/v1/members`;

const req = https.request(url, {
  method: 'OPTIONS',
  headers: {
    'apikey': supabaseKey
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('OPTIONS Response Status:', res.statusCode);
    console.log('OPTIONS Headers:', res.headers);
    console.log('OPTIONS Body (Raw):', data);
  });
});

req.on('error', (err) => {
  console.error('OPTIONS request error:', err);
});

req.end();
