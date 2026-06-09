const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require('@google/genai');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const apiKey = process.env.GEMINI_API_KEY_3 || process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseAnonKey || !apiKey) {
  console.error('Error: Faltan variables de entorno necesarias (Supabase o Gemini).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const ai = new GoogleGenAI({ apiKey });
const MODEL_ID = 'gemini-2.5-flash';

async function generarContenidoConGemini(tituloVideo) {
  const prompt = `
Sos un redactor profesional y experto en comunicación institucional para el ITEC (Innovación, Tecnología, Emprendedurismo y Ciencia) de Saladillo, Buenos Aires, Argentina.
Necesito generar una descripción y un resumen de IA para un nuevo video de nuestra videoteca titulado: "${tituloVideo}".

## Pautas de Redacción:
1. **Idioma/Tono**: Español rioplatense formal, profesional, inspirador, cercano e industrial. Usar el voseo con elegancia (ej: "te invitamos", "sumate", "descubrí").
2. **Vocabulario prohibido**: NUNCA uses "viste", "che", "pibe", "hoy", "ayer" o "mañana".
3. **Perspectiva**: ITEC es una ONG y asociación civil independiente y apolítica. Los videos son hitos de capacitación y desarrollo socioproductivo local.
4. **Augusto Cicaré**: ITEC se inspira en el legado de excelencia, resiliencia y precisión artesanal de Augusto Cicaré.
5. **Especificaciones**:
   - **Resumen IA**: Debe ser un bloque de texto inspirador e informativo de entre 80 y 130 palabras. Debe comenzar con gancho y reflejar la visión estratégica del curso o taller.
   - **Descripción**: Debe ser un texto descriptivo detallado, de unos 2 a 3 párrafos, que explique en qué consiste la formación, el impacto en el ecosistema productivo de Saladillo y la relevancia del conocimiento técnico.

Generá un objeto JSON con exactamente dos campos: "description" y "ai_summary". Devolvé ÚNICAMENTE el JSON válido, sin rodeos, sin bloques markdown de tipo \`\`\`json, solo el JSON plano.
`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.8,
        responseMimeType: 'application/json',
      }
    });

    const parsedData = JSON.parse(response.text.trim());
    return parsedData;
  } catch (error) {
    console.error(`Error al generar contenido con Gemini para "${tituloVideo}":`, error);
    return null;
  }
}

async function run() {
  try {
    // 1. Obtener los videos y filtrar localmente por el día de hoy (2026-05-21)
    const { data: todosLosVideos, error: getError } = await supabase
      .from('videos')
      .select('*')
      .eq('is_active', true);

    if (getError) throw getError;

    const videos = todosLosVideos.filter(video => 
      video.created_at && video.created_at.startsWith('2026-05-21')
    );

    if (!videos || videos.length === 0) {
      console.log('No se encontraron videos creados hoy (2026-05-21) para procesar.');
      return;
    }

    console.log(`\nSe encontraron ${videos.length} videos subidos hoy para procesar:\n`);

    for (const video of videos) {
      console.log(`========================================`);
      console.log(`Procesando: "${video.title}"`);
      console.log(`========================================`);

      // Generar descripción y resumen
      console.log('Generando descripción y resumen IA con Gemini...');
      const contenido = await generarContenidoConGemini(video.title);

      if (!contenido) {
        console.log(`No se pudo generar contenido para "${video.title}".`);
        continue;
      }

      console.log('\nResumen IA generado:\n', contenido.ai_summary);
      console.log('\nDescripción generada:\n', contenido.description);

      // 2. Actualizar el video en la base de datos
      console.log('\nActualizando video en la tabla public.videos...');
      const { data: updatedVideo, error: updateError } = await supabase
        .from('videos')
        .update({
          description: contenido.description,
          ai_summary: contenido.ai_summary
        })
        .eq('id', video.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error al actualizar el video:', updateError);
      } else {
        console.log(`¡Video "${updatedVideo.title}" actualizado con éxito!`);
      }

      // 3. Crear el registro en itec_actions (Acciones de Impacto)
      console.log('\nInsertando acción correspondiente en la tabla public.itec_actions...');
      const { data: insertedAction, error: actionError } = await supabase
        .from('itec_actions')
        .insert([{
          title: video.title,
          description: contenido.description,
          type: 'capacitacion',
          status: 'en_curso',
          target_audience: 'Comunidad de Saladillo, técnicos, operarios industriales y emprendedores.',
          tags: ['Formación', 'Capacitación', video.title.toLowerCase().includes('soldadura') ? 'Soldadura' : 'Automatización', 'Neumática', 'Metalmecánica'],
          thumbnail_url: video.thumbnail_url
        }])
        .select()
        .single();

      if (actionError) {
        console.error('Error al insertar acción:', actionError);
      } else {
        console.log(`¡Acción "${insertedAction.title}" creada con éxito! ID: ${insertedAction.id}`);
      }
      console.log(`========================================\n`);
    }

  } catch (error) {
    console.error('Ocurrió un error en la ejecución:', error);
  }
}

run();
