import { Resend } from 'resend'

/**
 * Envía un correo de bienvenida al miembro recién aprobado.
 */
export async function sendApprovalEmail(toEmail: string, fullName: string) {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey || apiKey === 're_123456789...') {
    console.warn('[email] RESEND_API_KEY no configurada o es el valor por defecto. Saltando envío.')
    return
  }

  try {
    const resend = new Resend(apiKey)
    
    const { data, error } = await resend.emails.send({
      from: 'ITEC Saladillo <onboarding@resend.dev>', // Usar dominio de prueba de Resend por defecto
      to: [toEmail],
      subject: '¡Bienvenido/a a ITEC! - Acceso Aprobado',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h1 style="color: #1e40af; font-size: 24px;">¡Hola, ${fullName}!</h1>
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Tu solicitud de acceso como miembro de <b>ITEC Saladillo</b> ha sido aprobada.
          </p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://pagina-eight-alpha.vercel.app'}/dashboard" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
               Ir al Panel de Miembros
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            ITEC Saladillo - Saladillo, Buenos Aires.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('[email] Error de Resend:', error)
      return { success: false, error }
    }

    return { success: true, data: data }
  } catch (err) {
    console.error('[email] Error inesperado:', err)
    return { success: false, error: err }
  }
}

/**
 * Envía un correo avisando que la cuenta ha sido reactivada.
 */
export async function sendReactivationEmail(toEmail: string, fullName: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 're_123456789...') return

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from: 'ITEC Saladillo <onboarding@resend.dev>',
      to: [toEmail],
      subject: 'Tu acceso a ITEC ha sido reactivado',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h1 style="color: #1e40af; font-size: 24px;">¡Hola de nuevo, ${fullName}!</h1>
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Te informamos que tu acceso al panel de miembros de <b>ITEC Saladillo</b> ha sido reactivado por la administración.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Ya podés volver a ingresar y participar de todas las actividades.
          </p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://pagina-eight-alpha.vercel.app'}/dashboard" 
               style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
               Volver al Dashboard
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            ITEC Saladillo - Saladillo, Buenos Aires.
          </p>
        </div>
      `,
    })
    return { success: !error, data, error }
  } catch (err) {
    return { success: false, error: err }
  }
}

/**
 * Envía un correo de bienvenida y acceso al asistente de un evento presencial.
 */
export async function sendEventWelcomeEmail(
  toEmail: string,
  fullName: string,
  eventName: string,
  eventSlug: string
) {
  const apiKey = process.env.RESEND_API_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pagina-eight-alpha.vercel.app'
  const eventLink = `${siteUrl}/eventos/${eventSlug}`

  if (!apiKey || apiKey === 're_123456789...') {
    console.log(`[SIMULACIÓN EMAIL] Enviando bienvenida de evento presencial:
    Para: ${fullName} <${toEmail}>
    Evento: ${eventName}
    Enlace de Acceso: ${eventLink}`)
    return { success: true, simulated: true }
  }

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from: 'ITEC Saladillo <eventos@resend.dev>',
      to: [toEmail],
      subject: `¡Registro Exitoso! - ${eventName}`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #030712; padding: 40px; border: 1px solid rgba(59, 130, 246, 0.1); border-radius: 16px; color: #f1f5f9;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #60a5fa; margin: 0; font-size: 14px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase;">ITEC Saladillo</h2>
            <div style="height: 1px; width: 50px; background-color: #3b82f6; margin: 10px auto;"></div>
          </div>
          
          <h1 style="color: #ffffff; font-size: 22px; text-align: center; font-weight: 800; margin-bottom: 20px;">
            ¡Hola, ${fullName}!
          </h1>
          
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
            Te has registrado correctamente para el evento presencial:<br>
            <strong style="color: #ffffff; font-size: 18px; display: block; margin-top: 10px;">${eventName}</strong>
          </p>

          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
            Usá el siguiente botón para acceder al <strong>Panel Interactivo del Participante</strong> directamente desde tu celular en el auditorio. Desde allí podrás participar de las encuestas en tiempo real, enviar preguntas al disertante y sumar palabras a la nube de ideas.
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${eventLink}" 
               style="background: linear-gradient(135deg, #3b82f6, #06b6d4); color: white; padding: 14px 32px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block; box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);">
               Ingresar al Panel del Participante
            </a>
          </div>

          <p style="color: #475569; font-size: 12px; text-align: center; margin-bottom: 30px;">
            Si el botón no funciona, podés copiar y pegar este enlace en tu navegador:<br>
            <a href="${eventLink}" style="color: #60a5fa; text-decoration: underline;">${eventLink}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.05); margin: 30px 0;">
          
          <p style="color: #64748b; font-size: 11px; text-align: center; margin: 0;">
            ITEC Saladillo — Innovación, Ciencia y Tecnología.<br>
            Saladillo, Buenos Aires.
          </p>
        </div>
      `,
    })
    return { success: !error, data, error }
  } catch (err) {
    return { success: false, error: err }
  }
}

