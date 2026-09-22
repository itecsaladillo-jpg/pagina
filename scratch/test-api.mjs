async function testAPI() {
  try {
    console.log('Enviando request a la API local con historial que inicia en "model" (caso real del frontend)...');
    const res = await fetch('http://localhost:3000/api/asistente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mensaje: 'Contame sobre el mapa productivo de Saladillo y qué puedo hacer en él.',
        historial: [
          { role: 'model', text: '¡Hola! Qué bueno encontrarte por acá. Soy el Asistente virtual de ITEC...' },
          { role: 'user', text: 'Hola' },
          { role: 'model', text: '¡Hola! Qué alegría que nos visites. Soy el Asistente ITEC...' }
        ]
      }),
    });
    console.log('Status de respuesta:', res.status);
    const text = await res.text();
    console.log('Respuesta de la API:');
    console.log(text);
  } catch (err) {
    console.error('Error al llamar a la API:', err);
  }
}

testAPI();
