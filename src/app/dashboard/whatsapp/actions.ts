'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { WhatsAppContact, WhatsAppGroup, WhatsAppTemplate, WhatsAppCategory, WhatsAppContactSource } from '@/types/database'

export type { WhatsAppContact, WhatsAppGroup, WhatsAppTemplate, WhatsAppCategory, WhatsAppContactSource }

type GroupContactRow = {
  contact_id: string
  whatsapp_contacts: WhatsAppContact
}

const contactSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  telefono: z.string().min(6, 'El teléfono es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  fuente: z.enum(['manual', 'vcf', 'csv', 'device']).default('manual'),
})

const groupSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  color: z.string().default('#25d366'),
})

const templateSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  cuerpo: z.string().min(1, 'El contenido es requerido'),
  categoria: z.enum(['general', 'evento', 'socio', 'sponsor', 'medio']),
})

// ─────────────────────────────────────────
// CONTACTOS
// ─────────────────────────────────────────

export async function getContactsAction(): Promise<{ success: boolean; contacts?: WhatsAppContact[]; error?: string }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .select('id, nombre, telefono, email, fuente, es_agenda_itec, creado_por, created_at')
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, contacts: data }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export async function createContactAction(data: z.infer<typeof contactSchema>) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const validated = contactSchema.parse(data)
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('whatsapp_contacts')
    .insert({ ...validated, es_agenda_itec: false, creado_por: admin.id })
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
    .update(validated)
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

// ─────────────────────────────────────────
// GRUPOS
// ─────────────────────────────────────────

export async function getGroupsAction(): Promise<{ success: boolean; groups?: WhatsAppGroup[]; error?: string }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('whatsapp_groups')
      .select('id, nombre, descripcion, color, creado_por, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, groups: data }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export async function createGroupAction(data: z.infer<typeof groupSchema>) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const validated = groupSchema.parse(data)
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('whatsapp_groups')
    .insert({ ...validated, creado_por: admin.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/whatsapp')
  return { success: true, data: result }
}

export async function saveGroupAction(data: z.infer<typeof groupSchema>) {
  return createGroupAction(data)
}

export async function updateGroupAction(id: string, data: Partial<z.infer<typeof groupSchema>>) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const validated = groupSchema.partial().parse(data)
  const supabase = await createClient()
  const { error } = await supabase
    .from('whatsapp_groups')
    .update(validated)
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

export async function addContactToGroupAction(contactId: string, groupId: string) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase
    .from('whatsapp_group_contacts')
    .insert({ contact_id: contactId, group_id: groupId })

  if (error && error.code !== '23505') throw new Error(error.message) // ignore duplicate key
  return { success: !error }
}

export async function removeContactFromGroupAction(contactId: string, groupId: string) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase
    .from('whatsapp_group_contacts')
    .delete()
    .match({ contact_id: contactId, group_id: groupId })

  if (error) throw new Error(error.message)
  return { success: true }
}

export async function getGroupContactsAction(groupId: string): Promise<{ success: boolean; contacts?: WhatsAppContact[]; error?: string }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('whatsapp_group_contacts')
      .select(`
        contact_id,
        whatsapp_contacts (
          id, nombre, telefono, email, fuente, es_agenda_itec, creado_por, created_at
        )
      `)
      .eq('group_id', groupId)

    if (error) return { success: false, error: error.message }
    const contacts = (data as unknown as GroupContactRow[]).map(item => item.whatsapp_contacts)
    return { success: true, contacts }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export async function getGroupWithContactsAction(groupId: string): Promise<{ success: boolean; group?: WhatsAppGroup; contacts?: WhatsAppContact[]; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: group, error: groupError } = await supabase
      .from('whatsapp_groups')
      .select('*')
      .eq('id', groupId)
      .single()
    if (groupError) return { success: false, error: groupError.message }
    const { data: contactsData, error: contactsError } = await supabase
      .from('whatsapp_group_contacts')
      .select(`
        contact_id,
        whatsapp_contacts (
          id, nombre, telefono, email, fuente, es_agenda_itec, creado_por, created_at
        )
      `)
      .eq('group_id', groupId)
    if (contactsError) return { success: false, error: contactsError.message }
    const contacts = (contactsData as unknown as GroupContactRow[]).map(item => item.whatsapp_contacts)
    return { success: true, group: group as WhatsAppGroup, contacts }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export async function setGroupContactsAction(groupId: string, contactIds: string[]) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  // Remove existing links
  await supabase.from('whatsapp_group_contacts').delete().eq('group_id', groupId)
  // Insert new links
  const rows = contactIds.map(contact_id => ({ group_id: groupId, contact_id }))
  if (rows.length > 0) {
    await supabase.from('whatsapp_group_contacts').insert(rows)
  }
  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

// ─────────────────────────────────────────
// PLANTILLAS
// ─────────────────────────────────────────

export async function getTemplatesAction(): Promise<{ success: boolean; templates?: WhatsAppTemplate[]; error?: string }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('id, titulo, cuerpo, categoria, autor_id, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, templates: data }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: message }
  }
}

export async function createTemplateAction(data: z.infer<typeof templateSchema>) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const validated = templateSchema.parse(data)
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('whatsapp_templates')
    .insert({ ...validated, autor_id: admin.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/whatsapp')
  return { success: true, data: result }
}

export async function saveTemplateAction(data: z.infer<typeof templateSchema>) {
  return createTemplateAction(data)
}

export async function updateTemplateAction(id: string, data: Partial<z.infer<typeof templateSchema>>) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const validated = templateSchema.partial().parse(data)
  const supabase = await createClient()
  const { error } = await supabase
    .from('whatsapp_templates')
    .update(validated)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

export async function deleteTemplateAction(id: string) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase
    .from('whatsapp_templates')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

// ─────────────────────────────────────────
// EXPORTAR ENLACES WHATSAPP
// ─────────────────────────────────────────

export async function generateWhatsAppLinksAction(params: {
  templateId?: string
  customMessage?: string
  contactIds?: string[]
  groupId?: string
}) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  let message = params.customMessage || ''
  if (params.templateId) {
    const supabase = await createClient()
    const { data: template, error } = await supabase
      .from('whatsapp_templates')
      .select('cuerpo')
      .eq('id', params.templateId)
      .single()
    if (error) throw new Error(error.message)
    message = template?.cuerpo || ''
  }

  let contacts: WhatsAppContact[] = []
  if (params.groupId) {
    const res = await getGroupContactsAction(params.groupId)
    if (!res.success) throw new Error(res.error)
    contacts = res.contacts || []
  } else if (params.contactIds) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .select('id, nombre, telefono, email')
      .in('id', params.contactIds)
    if (error) throw new Error(error.message)
    contacts = data || []
  } else {
    throw new Error('Debe seleccionar un grupo o contactos individuales')
  }

  const links = contacts.map((contact) => ({
    contactId: contact.id,
    nombre: contact.nombre,
    telefono: normalizePhone(contact.telefono),
    mensaje: message.replace(/{{nombre}}/g, contact.nombre).replace(/{{email}}/g, contact.email || ''),
    url: buildWhatsAppUrl(contact.telefono, message.replace(/{{nombre}}/g, contact.nombre)),
  }))

  // Log each link generation
  const supabase = await createClient()
  for (const link of links) {
    await supabase.from('whatsapp_logs').insert({
      destinatario_numero: link.telefono,
      destinatario_nombre: link.nombre,
      template_id: params.templateId || null,
      mensaje_enviado: link.mensaje,
      enviado_por: admin.id,
    })
  }

  return { success: true, links }
}

function normalizePhone(phone: string): string {
  // Remove non‑numeric characters
  let cleaned = phone.replace(/\D/g, '')
  // If starts with 0, remove leading 0
  if (cleaned.startsWith('0')) cleaned = cleaned.slice(1)
  // Add country code +54 if not present (Argentina)
  if (!cleaned.startsWith('54')) {
    if (cleaned.length === 10) {
      cleaned = '549' + cleaned // mobile adds 9 after 54
    } else if (cleaned.length === 11) {
      // assume already has 54? maybe not
      if (!cleaned.startsWith('54')) cleaned = '54' + cleaned
    }
  }
  return '+' + cleaned
}

function buildWhatsAppUrl(phone: string, message: string): string {
  const phoneClean = phone.replace(/[+\-\s()]/g, '')
  const encodedMessage = encodeURIComponent(message)
  return `https://web.whatsapp.com/send?phone=${phoneClean}&text=${encodedMessage}`
}

// ─────────────────────────────────────────
// ACCIONES ADICIONALES PARA UI
// ─────────────────────────────────────────

export async function saveContactAction(data: { nombre: string; telefono: string; email?: string; fuente?: WhatsAppContactSource }) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const validated = contactSchema.parse(data)
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('whatsapp_contacts')
    .insert({ ...validated, es_agenda_itec: false, creado_por: admin.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/whatsapp')
  return { success: true, data: result }
}

export async function saveContactsBulkAction(contacts: Array<{ nombre: string; telefono: string; email?: string }>, source: WhatsAppContactSource) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const inserted: WhatsAppContact[] = []
  for (const c of contacts) {
    const validated = contactSchema.parse({ ...c, fuente: source })
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .insert({ ...validated, es_agenda_itec: false, creado_por: admin.id })
      .select()
      .single()
    if (!error && data) inserted.push(data)
  }
  revalidatePath('/dashboard/whatsapp')
  return { success: true, contacts: inserted }
}

export async function updateUnifiedContactAction(id: string, data: { nombre?: string; telefono?: string; email?: string }) {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase
    .from('whatsapp_contacts')
    .update(data)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

export async function deleteUnifiedContactAction(id: string) {
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