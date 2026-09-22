'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'

// ─── Tipos ──────────────────────────────────────────────────

export interface WhatsAppTemplate {
  id: string
  titulo: string
  cuerpo: string
  categoria: 'general' | 'evento' | 'socio' | 'sponsor' | 'medio'
  autor_id: string | null
  created_at: string
  updated_at: string
}

// ─── Queries ─────────────────────────────────────────────────

export async function getTemplatesAction(): Promise<WhatsAppTemplate[]> {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('whatsapp_templates')
    .select('*')
    .order('categoria')
    .order('titulo')

  if (error) {
    console.error('[whatsapp] getTemplatesAction error:', error.message)
    return []
  }

  return data ?? []
}

// ─── Mutations ───────────────────────────────────────────────

export async function saveTemplateAction(data: {
  id?: string
  titulo: string
  cuerpo: string
  categoria: WhatsAppTemplate['categoria']
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') {
    return { success: false, error: 'No autorizado' }
  }

  const supabase = await createClient()

  if (data.id) {
    // UPDATE
    const { error } = await supabase
      .from('whatsapp_templates')
      .update({ titulo: data.titulo, cuerpo: data.cuerpo, categoria: data.categoria })
      .eq('id', data.id)

    if (error) {
      console.error('[whatsapp] saveTemplateAction update error:', error.message)
      return { success: false, error: error.message }
    }
  } else {
    // INSERT
    const { data: inserted, error } = await supabase
      .from('whatsapp_templates')
      .insert({ titulo: data.titulo, cuerpo: data.cuerpo, categoria: data.categoria, autor_id: member.id })
      .select('id')
      .single()

    if (error) {
      console.error('[whatsapp] saveTemplateAction insert error:', error.message)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/whatsapp')
    return { success: true, id: inserted.id }
  }

  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

export async function deleteTemplateAction(id: string): Promise<{ success: boolean; error?: string }> {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') {
    return { success: false, error: 'No autorizado' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('whatsapp_templates')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[whatsapp] deleteTemplateAction error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

/**
 * Registra en auditoría que se generó/abrió un link de WhatsApp.
 */
export async function logWhatsAppSendAction(data: {
  destinatario_numero: string
  destinatario_nombre?: string
  template_id?: string
  mensaje_enviado: string
}): Promise<{ success: boolean }> {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') return { success: false }

  const supabase = await createClient()
  await supabase.from('whatsapp_logs').insert({
    destinatario_numero: data.destinatario_numero,
    destinatario_nombre: data.destinatario_nombre ?? null,
    template_id: data.template_id ?? null,
    mensaje_enviado: data.mensaje_enviado,
    enviado_por: member.id,
  })

  return { success: true }
}

// ═══════════════════════════════════════════════════════════════
// CONTACTOS EXTERNOS
// ═══════════════════════════════════════════════════════════════

export interface WhatsAppContact {
  id: string
  nombre: string
  telefono: string
  email: string | null
  fuente: 'manual' | 'vcf' | 'csv' | 'device'
  es_agenda_itec: boolean
  creado_por: string | null
  created_at: string
}

export interface WhatsAppGroup {
  id: string
  nombre: string
  descripcion: string | null
  color: string
  creado_por: string | null
  created_at: string
  updated_at: string
  contact_count?: number
}

export interface WhatsAppGroupWithContacts extends WhatsAppGroup {
  contacts: WhatsAppContact[]
}

// ─── Queries de contactos ────────────────────────────────────

export async function getContactsAction(): Promise<WhatsAppContact[]> {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('whatsapp_contacts')
    .select('*')
    .order('nombre')

  if (error) {
    console.error('[whatsapp] getContactsAction error:', error.message)
    return []
  }

  return data ?? []
}

export async function getGroupsAction(): Promise<WhatsAppGroup[]> {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('whatsapp_groups')
    .select(`
      *,
      whatsapp_group_contacts(count)
    `)
    .order('nombre')

  if (error) {
    console.error('[whatsapp] getGroupsAction error:', error.message)
    return []
  }

  return (data ?? []).map((g: any) => ({
    ...g,
    contact_count: g.whatsapp_group_contacts?.[0]?.count ?? 0,
  }))
}

export async function getGroupWithContactsAction(groupId: string): Promise<WhatsAppGroupWithContacts | null> {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('whatsapp_groups')
    .select(`
      *,
      whatsapp_group_contacts(
        whatsapp_contacts(*)
      )
    `)
    .eq('id', groupId)
    .single()

  if (error || !data) {
    console.error('[whatsapp] getGroupWithContactsAction error:', error?.message)
    return null
  }

  const contacts: WhatsAppContact[] = (data.whatsapp_group_contacts ?? [])
    .map((r: any) => r.whatsapp_contacts)
    .filter(Boolean)

  return { ...data, contacts }
}

// ─── Mutations de contactos ──────────────────────────────────

export async function saveContactAction(data: {
  id?: string
  nombre: string
  telefono: string
  email?: string
  fuente?: WhatsAppContact['fuente']
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') return { success: false, error: 'No autorizado' }

  const supabase = await createClient()
  const payload = {
    nombre: data.nombre.trim(),
    telefono: data.telefono.trim(),
    email: data.email?.trim() || null,
    fuente: data.fuente ?? 'manual',
    es_agenda_itec: true,
    creado_por: member.id,
  }

  if (data.id) {
    const { error } = await supabase
      .from('whatsapp_contacts')
      .update({ nombre: payload.nombre, telefono: payload.telefono, email: payload.email })
      .eq('id', data.id)

    if (error) return { success: false, error: error.message }
  } else {
    const { data: inserted, error } = await supabase
      .from('whatsapp_contacts')
      .insert(payload)
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/whatsapp')
    return { success: true, id: inserted.id }
  }

  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

/**
 * Importa múltiples contactos de una sola vez (post vCard/CSV/device).
 * Ignora duplicados por teléfono (upsert).
 */
export async function saveContactsBulkAction(
  contacts: Array<{ nombre: string; telefono: string; email?: string }>,
  fuente: WhatsAppContact['fuente']
): Promise<{
  success: boolean
  inserted: number
  contacts: WhatsAppContact[]
  error?: string
}> {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') return { success: false, inserted: 0, contacts: [], error: 'No autorizado' }

  if (contacts.length === 0) return { success: true, inserted: 0, contacts: [] }

  const supabase = await createClient()
  const rows = contacts.map(c => ({
    nombre: c.nombre.trim(),
    telefono: c.telefono.trim(),
    email: c.email?.trim() || null,
    fuente,
    es_agenda_itec: true,
    creado_por: member.id,
  }))

  const { data, error } = await supabase
    .from('whatsapp_contacts')
    .upsert(rows, { onConflict: 'telefono', ignoreDuplicates: true })
    .select('*')

  if (error) {
    console.error('[whatsapp] saveContactsBulkAction error:', error.message)
    return { success: false, inserted: 0, contacts: [], error: error.message }
  }

  revalidatePath('/dashboard/whatsapp')
  const insertedContacts: WhatsAppContact[] = (data ?? []).map((row: any) => ({
    id: row.id,
    nombre: row.nombre,
    telefono: row.telefono,
    email: row.email ?? null,
    fuente: row.fuente as WhatsAppContact['fuente'],
    es_agenda_itec: row.es_agenda_itec,
    creado_por: row.creado_por ?? null,
    created_at: row.created_at,
  }))
  return { success: true, inserted: insertedContacts.length, contacts: insertedContacts }
}

export async function deleteContactAction(id: string): Promise<{ success: boolean; error?: string }> {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') return { success: false, error: 'No autorizado' }

  const supabase = await createClient()
  const { error } = await supabase.from('whatsapp_contacts').delete().eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

// ─── Mutations de grupos ──────────────────────────────────────

export async function saveGroupAction(data: {
  id?: string
  nombre: string
  descripcion?: string
  color?: string
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') return { success: false, error: 'No autorizado' }

  const supabase = await createClient()
  const payload = {
    nombre: data.nombre.trim(),
    descripcion: data.descripcion?.trim() || null,
    color: data.color ?? '#25d366',
    creado_por: member.id,
  }

  if (data.id) {
    const { error } = await supabase
      .from('whatsapp_groups')
      .update({ nombre: payload.nombre, descripcion: payload.descripcion, color: payload.color })
      .eq('id', data.id)

    if (error) return { success: false, error: error.message }
  } else {
    const { data: inserted, error } = await supabase
      .from('whatsapp_groups')
      .insert(payload)
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/whatsapp')
    return { success: true, id: inserted.id }
  }

  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

export async function deleteGroupAction(id: string): Promise<{ success: boolean; error?: string }> {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') return { success: false, error: 'No autorizado' }

  const supabase = await createClient()
  const { error } = await supabase.from('whatsapp_groups').delete().eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

export async function setGroupContactsAction(
  groupId: string,
  contactsToSync: { id: string, nombre: string, telefono: string, email: string | null, tipo: string }[]
): Promise<{ success: boolean; error?: string }> {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') return { success: false, error: 'No autorizado' }

  const supabase = await createClient()

  // 1. Asegurar que todos existan en whatsapp_contacts para respetar la FK
  let phoneToId = new Map<string, string>()
  if (contactsToSync.length > 0) {
    const rowsToUpsert = contactsToSync.map(c => ({
      nombre: c.nombre,
      telefono: c.telefono,
      email: c.email,
      fuente: c.tipo === 'miembro' ? 'manual' : c.tipo,
      es_agenda_itec: true,
      creado_por: member.id
    }))

    const { data: upsertedContacts, error: upsertError } = await supabase
      .from('whatsapp_contacts')
      .upsert(rowsToUpsert, { onConflict: 'telefono' })
      .select('id, telefono')

    if (upsertError) {
      console.error('[whatsapp] upsert error in setGroupContactsAction:', upsertError.message)
      return { success: false, error: upsertError.message }
    }

    if (upsertedContacts) {
      for (const uc of upsertedContacts) {
        phoneToId.set(uc.telefono, uc.id)
      }
    }
  }

  // 2. Reemplazar todos los miembros del grupo
  const { error: delError } = await supabase
    .from('whatsapp_group_contacts')
    .delete()
    .eq('group_id', groupId)

  if (delError) return { success: false, error: delError.message }

  if (contactsToSync.length > 0) {
    const rows = contactsToSync.map(c => ({
      group_id: groupId,
      contact_id: phoneToId.get(c.telefono) || c.id
    }))
    const { error: insError } = await supabase.from('whatsapp_group_contacts').insert(rows)
    if (insError) return { success: false, error: insError.message }
  }

  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

export async function updateUnifiedContactAction(id: string, tipo: string, payload: { nombre: string, telefono: string, email: string | null }) {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') return { success: false, error: 'No autorizado' }
  const supabase = await createClient()

  if (tipo === 'miembro') {
    const { error } = await supabase.from('members').update({ full_name: payload.nombre, phone: payload.telefono, email: payload.email }).eq('id', id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await supabase.from('whatsapp_contacts').update({ nombre: payload.nombre, telefono: payload.telefono, email: payload.email }).eq('id', id)
    if (error) return { success: false, error: error.message }
  }
  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

export async function deleteUnifiedContactAction(id: string, tipo: string) {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') return { success: false, error: 'No autorizado' }
  const supabase = await createClient()

  if (tipo === 'miembro') {
    return { success: false, error: 'No se puede eliminar un miembro desde la agenda de WhatsApp.' }
  } else {
    const { error } = await supabase.from('whatsapp_contacts').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
  }
  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}
