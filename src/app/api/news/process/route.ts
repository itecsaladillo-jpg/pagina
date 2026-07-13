import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

async function generarTextosIA(datos_crudos: string) {
  const prompts = {
    publico: `Actuarás como editor de prensa regional. Redactá un texto para el público con tono inspirador. NO mencionés biografía de Cicaré. Máximo 200 palabras. Devolvé SOLO el texto.`,
    miembros: `Actuarás como community manager. Redactá un texto para miembros internos con tono de logro superador y motivación. Máximo 150 palabras. Devolvé SOLO el texto.`,
    medios: `Actuarás como redactor de gacetillas. Generá un formato periodístico con: TÍTULO (máx 10 palabras), COPETE (1 línea), CUERPO (máx 200 palabras, párrafos cortos). Devolvé SOLO el texto con formato: "Título: ...\nCopete: ...\nCuerpo: ..."`,
    sponsors: `Actuarás como analista de relaciones institucionales. Generá un reporte ejecutivo con enfoque en costo/beneficio y visión de alianza. Máximo 250 palabras. Devolvé SOLO el texto.`
  }

  const resultados: any = {}
  
  for (const [canal, prompt] of Object.entries(prompts)) {
    const { text } = await generateText({
      model: google('gemini-pro'),
      prompt: prompt + '\n\nDatos: ' + datos_crudos,
    })
    resultados[canal] = text
  }

  return resultados
}

async function enviarEmailsAsincronos(newsFlashId: string, textos: any) {
  const supabase = await createClient()

  // Enviar a medios de prensa
  const { data: medios } = await supabase.from('medios_prensa').select('email, nombre_medio')
  if (medios?.length) {
    for (const medio of medios) {
      resend.emails.send({
        from: 'ITEC Saladillo <notificaciones@itec-saladillo.app>',
        to: medio.email,
        subject: `Gacetilla ITEC - ${medio.nombre_medio}`,
        html: `<pre style="font-family: monospace; white-space: pre-wrap;">${textos.medios}</pre>`
      }).catch(console.error)
    }
  }

  // Enviar a sponsors
  const { data: sponsors } = await supabase.from('sponsors').select('id, nombre_empresa, email')
  if (sponsors?.length) {
    for (const sponsor of sponsors) {
      const link = `https://itec-saladillo.app/sponsors/${newsFlashId}?auth=${sponsor.id}`
      resend.emails.send({
        from: 'ITEC Saladillo <notificaciones@itec-saladillo.app>',
        to: sponsor.email,
        subject: `Reporte de Impacto - ${sponsor.nombre_empresa}`,
        html: `<p>Hola ${sponsor.nombre_empresa},</p><p>${textos.sponsors}</p><p><a href="${link}">Ver reporte completo</a></p>`
      }).catch(console.error)
    }
  }
}

export async function POST(request: NextRequest) {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { titulo, datos_crudos } = await request.json()

  try {
    const textos = await generarTextosIA(datos_crudos)

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('news_flashes')
      .insert([{
        titulo,
        datos_crudos,
        texto_publico: textos.publico,
        texto_miembros: textos.miembros,
        texto_medios: textos.medios,
        texto_sponsors: textos.sponsors,
        para_publico: true,
        para_miembros: true,
        autor_id: member.id,
        is_published: true,
      }])
      .select()
      .single()

    if (error) throw error

    // Envío de emails asíncrono
    enviarEmailsAsincronos(data.id, textos)

    return NextResponse.json({ success: true, result: textos, data })
  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}