const https = require('https');

const supabaseUrl = 'https://ooqosswidezaexqyebqa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcW9zc3dpZGV6YWV4cXllYnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyODI2MDQsImV4cCI6MjA5Mzg1ODYwNH0.liGGoO5yxRbHIXF96iiSA8Igw0uVaVYWE7v7dcbjky4';

const url = `${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`;

https.get(url, {
  headers: {
    'Accept': 'application/json',
    'apikey': supabaseKey
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const schema = JSON.parse(data);
      if (schema && schema.definitions && schema.definitions.members) {
        console.log('Members Table Properties:');
        console.log(JSON.stringify(schema.definitions.members.properties, null, 2));
      } else {
        console.log('Error payload:', schema);
      }
    } catch (e) {
      console.error('Error parsing JSON:', e);
      console.log('Raw data received:', data.substring(0, 500));
    }
  });
}).on('error', (err) => {
  console.error('HTTPS request error:', err);
});
