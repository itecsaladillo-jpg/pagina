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
      from: 'ITEC Augusto Cicaré <onboarding@resend.dev>', // Usar dominio de prueba de Resend por defecto
      to: [toEmail],
      subject: '¡Bienvenido/a al ITEC! - Acceso Aprobado',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h1 style="color: #1e40af; font-size: 24px;">¡Hola, ${fullName}!</h1>
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Tu solicitud de acceso como miembro del <b>ITEC "Augusto Cicaré"</b> ha sido aprobada.
          </p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://pagina-eight-alpha.vercel.app'}/dashboard" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
               Ir al Panel de Miembros
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            ITEC Augusto Cicaré - Saladillo, Buenos Aires.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('[email] Error de Resend:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (err) {
    console.error('[email] Error inesperado:', err)
    return { success: false, error: err }
  }
}
