const https = require('https');

const supabaseUrl = 'https://ooqosswidezaexqyebqa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcW9zc3dpZGV6YWV4cXllYnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyODI2MDQsImV4cCI6MjA5Mzg1ODYwNH0.liGGoO5yxRbHIXF96iiSA8Igw0uVaVYWE7v7dcbjky4';

const url = `${supabaseUrl}/graphql/v1`;

const query = {
  query: `
    query {
      __type(name: "members") {
        fields {
          name
          type {
            name
            kind
          }
        }
      }
    }
  `
};

const payload = JSON.stringify(query);

const req = https.request(url, {
  method: 'POST',
  headers: {
    'apikey': supabaseKey,
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('GraphQL Status:', res.statusCode);
    try {
      const response = JSON.parse(data);
      if (response.data && response.data.__type) {
        console.log('GraphQL Introspection Successful! Columns found:');
        response.data.__type.fields.forEach(f => {
          console.log(` - ${f.name} (${f.type.name || f.type.kind})`);
        });
      } else {
        console.log('GraphQL response:', response);
      }
    } catch (e) {
      console.error('Error parsing JSON:', e);
      console.log('Raw data:', data);
    }
  });
});

req.on('error', (err) => {
  console.error('GraphQL request error:', err);
});

req.write(payload);
req.end();
