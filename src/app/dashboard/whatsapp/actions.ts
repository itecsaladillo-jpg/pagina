'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { WhatsAppGroup, WhatsAppContact } from '@/types/database'

const groupSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
})

const contactSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().default(''),
  telefono: z.string().min(6, 'El teléfono es requerido'),
  grupo_id: z.string().uuid().nullable().optional(),
  notas: z.string().optional(),
})

// ─────────────────────────────────────────
// GRUPOS
// ─────────────────────────────────────────

export async function createGroupAction(data: z.infer<typeof groupSchema>) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const validated = groupSchema.parse(data)

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('whatsapp_groups')
    .insert(validated)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/whatsapp')
  return { success: true, data: result }
}

export async function updateGroupAction(id: string, data: Partial<z.infer<typeof groupSchema>>) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const validated = groupSchema.partial().parse(data)

  const supabase = await createClient()
  const { error } = await supabase
    .from('whatsapp_groups')
    .update({ ...validated, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

export async function deleteGroupAction(id: string) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase
    .from('whatsapp_groups')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

export async function getGroupsAction(): Promise<{ success: boolean; groups?: WhatsAppGroup[]; error?: string }> {
  try {
    const admin = await getCurrentMember()
    if (!admin || admin.role !== 'admin') {
      return { success: false, error: 'No autorizado' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('whatsapp_groups')
      .select('id, nombre, descripcion, created_at, updated_at')
      .order('created_at', { ascending: true })

    if (error) return { success: false, error: error.message }
    return { success: true, groups: data }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

// ─────────────────────────────────────────
// CONTACTOS
// ─────────────────────────────────────────

export async function createContactAction(data: z.infer<typeof contactSchema>) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const validated = contactSchema.parse(data)

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('whatsapp_contacts')
    .insert(validated)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/whatsapp')
  return { success: true, data: result }
}

export async function updateContactAction(id: string, data: Partial<z.infer<typeof contactSchema>>) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const validated = contactSchema.partial().parse(data)

  const supabase = await createClient()
  const { error } = await supabase
    .from('whatsapp_contacts')
    .update({ ...validated, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

export async function deleteContactAction(id: string) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase
    .from('whatsapp_contacts')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

export async function getContactsByGroupAction(grupoId: string): Promise<{
  success: boolean
  contacts?: WhatsAppContact[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .select('id, nombre, apellido, telefono, grupo_id, notas, created_at, updated_at')
      .eq('grupo_id', grupoId)
      .order('created_at', { ascending: true })

    if (error) return { success: false, error: error.message }
    return { success: true, contacts: data }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

// ─────────────────────────────────────────
// INVITACIONES POR WHATSAPP
// ─────────────────────────────────────────

export async function generateWhatsAppInvitationsAction(data: {
  grupoId: string
  type: 'sponsor' | 'training'
  title: string
  linkId: string
}) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { data: contacts, error } = await supabase
    .from('whatsapp_contacts')
    .select('id, nombre, apellido, telefono')
    .eq('grupo_id', data.grupoId)

  if (error) throw new Error(error.message)
  if (!contacts || contacts.length === 0) throw new Error('El grupo no tiene contactos.')

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pagina-eight-alpha.vercel.app'
  const fullLink = `${baseUrl}/${data.type === 'sponsor' ? 'sponsors' : 'capacitaciones'}/${data.linkId}`

  const invitations = contacts.map((contact) => {
    const fullName = `${contact.nombre} ${contact.apellido}`.trim()

    let message = ''
    if (data.type === 'sponsor') {
      message = `Estimado/a ${fullName}, es un placer saludarte. Adjuntamos el Reporte de Impacto Estratégico de ITEC Saladillo correspondiente a vuestra alianza: ${fullLink}. Gracias por vuestra apuesta por la excelencia técnica.`
    } else {
      message = `Hola ${fullName}, te invitamos a sumarte a nuestra próxima capacitación en vivo: "${data.title}". Podés participar y votar en tiempo real ingresando aquí: ${fullLink}. ¡Te esperamos!`
    }

    return {
      contactId: contact.id,
      contactName: fullName,
      phone: contact.telefono,
      whatsappUrl: `https://wa.me/${contact.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`,
    }
  })

  return { success: true, invitations }
}
