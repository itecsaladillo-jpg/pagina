'use server'

import { getCurrentMember } from '@/services/auth'

/**
 * Genera un texto pre-formateado para enviar invitaciones por WhatsApp.
 */
export async function generateInvitationAction(data: {
  recipientName: string
  type: 'sponsor' | 'training'
  title: string
  linkId: string
}) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pagina-eight-alpha.vercel.app'
  const fullLink = `${baseUrl}/${data.type === 'sponsor' ? 'sponsors' : 'capacitaciones'}/${data.linkId}`

  let message = ''

  if (data.type === 'sponsor') {
    message = `Estimado/a ${data.recipientName}, es un placer saludarte. Adjuntamos el Reporte de Impacto Estratégico de ITEC "Augusto Cicaré" correspondiente a vuestra alianza: ${fullLink}. Gracias por vuestra apuesta por la excelencia técnica.`
  } else {
    message = `Hola ${data.recipientName}, te invitamos a sumarte a nuestra próxima capacitación en vivo: "${data.title}". Podés participar y votar en tiempo real ingresando aquí: ${fullLink}. ¡Te esperamos!`
  }

  // No usamos "hoy", "mañana", "ayer", "viste", "che", "pibe"
  return {
    success: true,
    message,
    whatsappUrl: `https://wa.me/?text=${encodeURIComponent(message)}`
  }
}
