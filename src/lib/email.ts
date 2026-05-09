import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Envía un correo de bienvenida al miembro recién aprobado.
 */
export async function sendApprovalEmail(toEmail: string, fullName: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY no configurada. Saltando envío de email.')
    return
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'ITEC Augusto Cicaré <no-reply@tu-dominio.com>', // Reemplazar con dominio verificado
      to: [toEmail],
      subject: '¡Bienvenido/a al ITEC! - Acceso Aprobado',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 40px; border-radius: 10px;">
          <h1 style="color: #1e40af; font-size: 24px;">¡Hola, ${fullName}!</h1>
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Nos complace informarte que tu solicitud de acceso como miembro del <b>ITEC "Augusto Cicaré"</b> ha sido aprobada por la administración.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Ya podés ingresar a nuestro panel de miembros para ver las noticias de tu comisión, inscribirte a capacitaciones y participar activamente.
          </p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
               Ingresar al Dashboard
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Este es un correo automático. No es necesario responder.
            <br>ITEC Augusto Cicaré - Saladillo, Buenos Aires.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('[email] Error enviando email con Resend:', error)
    }

    return data
  } catch (err) {
    console.error('[email] Error inesperado en sendApprovalEmail:', err)
  }
}
