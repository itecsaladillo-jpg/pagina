'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { normalizeWhatsAppPhone } from '@/lib/waPhone'
import type { WhatsAppContact, WhatsAppGroup, WhatsAppTemplate } from '@/types/database'

type Result<T = undefined> = { success: boolean; data?: T; error?: string }

async function requireAdmin() {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') return null
  return member
}

// ── GRUPOS ──────────────────────────────────────────────────

export async function getGroupsAction(): Promise<Result<WhatsAppGroup[]>> {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: 'No autorizado' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('whatsapp_groups')
    .select('*')
    .order('nombre_grupo')

  if (error) return { success: false, error: error.message }
  return { success: true, data: data as WhatsAppGroup[] }
}

export async function saveGroupAction(input: {
  id?: string
  nombre_grupo: string
  descripcion?: string | null
  color?: string
}): Promise<Result<WhatsAppGroup>> {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: 'No autorizado' }
  if (!input.nombre_grupo?.trim()) return { success: false, error: 'El nombre es obligatorio' }

  const supabase = await createClient()
  const nombre = input.nombre_grupo.trim()

  if (input.id) {
    const { data, error } = await supabase
      .from('whatsapp_groups')
      .update({
        nombre_grupo: nombre,
        descripcion: input.descripcion ?? null,
        ...(input.color ? { color: input.color } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/whatsapp')
    return { success: true, data: data as WhatsAppGroup }
  }

  const { data, error } = await supabase
    .from('whatsapp_groups')
    .insert({
      nombre_grupo: nombre,
      descripcion: input.descripcion ?? null,
      color: input.color ?? '#25d366',
      creado_por: admin.id,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/whatsapp')
  return { success: true, data: data as WhatsAppGroup }
}

export async function deleteGroupAction(id: string): Promise<Result> {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: 'No autorizado' }

  const supabase = await createClient()
  const { error } = await supabase.from('whatsapp_groups').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

export async function getGroupWithContactsAction(
  groupId: string
): Promise<Result<{ group: WhatsAppGroup; contacts: WhatsAppContact[] }>> {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: 'No autorizado' }

  const supabase = await createClient()

  const { data: group, error: gErr } = await supabase
    .from('whatsapp_groups')
    .select('*')
    .eq('id', groupId)
    .single()
  if (gErr) return { success: false, error: gErr.message }

  const { data: links, error: lErr } = await supabase
    .from('whatsapp_group_contacts')
    .select('contact_id, whatsapp_contacts(*)')
    .eq('group_id', groupId)
  if (lErr) return { success: false, error: lErr.message }

  const contacts = (links ?? [])
    .map((l: { whatsapp_contacts: unknown }) => {
      const wc = l.whatsapp_contacts
      return (Array.isArray(wc) ? wc[0] : wc) as WhatsAppContact | null
    })
    .filter((c): c is WhatsAppContact => Boolean(c))

  return { success: true, data: { group: group as WhatsAppGroup, contacts } }
}

export async function setGroupContactsAction(
  groupId: string,
  contactIds: string[]
): Promise<Result> {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: 'No autorizado' }

  const supabase = await createClient()

  const { error: delErr } = await supabase
    .from('whatsapp_group_contacts')
    .delete()
    .eq('group_id', groupId)
  if (delErr) return { success: false, error: delErr.message }

  if (contactIds.length > 0) {
    const rows = contactIds.map((contact_id) => ({ group_id: groupId, contact_id }))
    const { error: insErr } = await supabase.from('whatsapp_group_contacts').insert(rows)
    if (insErr) return { success: false, error: insErr.message }
  }

  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

// ── CONTACTOS ───────────────────────────────────────────────

export async function getContactsAction(): Promise<Result<WhatsAppContact[]>> {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: 'No autorizado' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('whatsapp_contacts')
    .select('*')
    .order('nombre')

  if (error) return { success: false, error: error.message }
  return { success: true, data: data as WhatsAppContact[] }
}

export async function importMembersToAgendaAction(): Promise<
  Result<{ imported: number; updated: number; skipped: number }>
> {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: 'No autorizado' }

  const supabase = await createClient()

  const { data: members, error: mErr } = await supabase
    .from('members')
    .select('full_name, email, phone, status')
    .eq('status', 'activo')
    .not('phone', 'is', null)

  if (mErr) return { success: false, error: mErr.message }

  const { data: existing, error: eErr } = await supabase
    .from('whatsapp_contacts')
    .select('id, telefono')

  if (eErr) return { success: false, error: eErr.message }

  const byPhone = new Map<string, string>((existing ?? []).map((c) => [c.telefono, c.id]))

  const toInsert: {
    nombre: string
    telefono: string
    email: string | null
    fuente: 'miembro'
    es_agenda_itec: boolean
    creado_por: string
  }[] = []
  const toUpdate: { id: string; nombre: string; email: string | null }[] = []
  let skipped = 0

  for (const m of members ?? []) {
    const raw = m.phone?.trim()
    if (!raw) {
      skipped++
      continue
    }
    const tel = normalizeWhatsAppPhone(raw)
    if (!tel || tel.length < 8) {
      skipped++
      continue
    }

    const nombre = (m.full_name || '').trim()
    const email = m.email?.trim() || null
    if (!nombre) {
      skipped++
      continue
    }

    const existingId = byPhone.get(tel)
    if (existingId) {
      toUpdate.push({ id: existingId, nombre, email })
    } else {
      toInsert.push({
        nombre,
        telefono: tel,
        email,
        fuente: 'miembro',
        es_agenda_itec: true,
        creado_por: admin.id,
      })
      byPhone.set(tel, 'new')
    }
  }

  if (toInsert.length) {
    const { error } = await supabase.from('whatsapp_contacts').insert(toInsert)
    if (error) return { success: false, error: error.message }
  }

  if (toUpdate.length) {
    const { error } = await supabase
      .from('whatsapp_contacts')
      .upsert(
        toUpdate.map((u) => ({ id: u.id, nombre: u.nombre, email: u.email })),
        { onConflict: 'id' }
      )
    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/whatsapp')
  return {
    success: true,
    data: { imported: toInsert.length, updated: toUpdate.length, skipped },
  }
}

export async function saveContactAction(input: {
  id?: string
  nombre: string
  telefono: string
  email?: string | null
  fuente?: string
  es_agenda_itec?: boolean
}): Promise<Result<WhatsAppContact>> {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: 'No autorizado' }
  if (!input.nombre?.trim() || !input.telefono?.trim()) {
    return { success: false, error: 'Nombre y teléfono son obligatorios' }
  }

  const supabase = await createClient()
  const payload = {
    nombre: input.nombre.trim(),
    telefono: normalizeWhatsAppPhone(input.telefono),
    email: input.email?.trim() || null,
    ...(input.es_agenda_itec !== undefined ? { es_agenda_itec: input.es_agenda_itec } : {}),
  }

  if (input.id) {
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .update(payload)
      .eq('id', input.id)
      .select()
      .single()
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/whatsapp')
    return { success: true, data: data as WhatsAppContact }
  }

  const { data, error } = await supabase
    .from('whatsapp_contacts')
    .insert({ ...payload, fuente: input.fuente ?? 'manual', creado_por: admin.id })
    .select()
    .single()
  if (error) {
    if (error.code === '23505') return { success: false, error: 'Ese teléfono ya existe' }
    return { success: false, error: error.message }
  }
  revalidatePath('/dashboard/whatsapp')
  return { success: true, data: data as WhatsAppContact }
}

export async function deleteContactAction(id: string): Promise<Result> {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: 'No autorizado' }

  const supabase = await createClient()
  const { error } = await supabase.from('whatsapp_contacts').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

// ── PLANTILLAS ──────────────────────────────────────────────

export async function getTemplatesAction(): Promise<Result<WhatsAppTemplate[]>> {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: 'No autorizado' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('whatsapp_templates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data: data as WhatsAppTemplate[] }
}

export async function saveTemplateAction(input: {
  id?: string
  titulo: string
  contenido: string
  categoria?: string
}): Promise<Result<WhatsAppTemplate>> {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: 'No autorizado' }
  if (!input.titulo?.trim() || !input.contenido?.trim()) {
    return { success: false, error: 'Título y contenido son obligatorios' }
  }

  const supabase = await createClient()
  const payload = {
    titulo: input.titulo.trim(),
    contenido: input.contenido,
    categoria: input.categoria ?? 'general',
  }

  if (input.id) {
    const { data, error } = await supabase
      .from('whatsapp_templates')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', input.id)
      .select()
      .single()
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/whatsapp')
    return { success: true, data: data as WhatsAppTemplate }
  }

  const { data, error } = await supabase
    .from('whatsapp_templates')
    .insert({ ...payload, autor_id: admin.id })
    .select()
    .single()
  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/whatsapp')
  return { success: true, data: data as WhatsAppTemplate }
}

export async function deleteTemplateAction(id: string): Promise<Result> {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: 'No autorizado' }

  const supabase = await createClient()
  const { error } = await supabase.from('whatsapp_templates').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/whatsapp')
  return { success: true }
}

// ── AUDITORÍA DE ENVÍOS ─────────────────────────────────────

export async function logWhatsAppSendAction(
  entries: { destinatario_numero: string; destinatario_nombre: string | null; mensaje_enviado: string }[]
): Promise<Result> {
  const admin = await requireAdmin()
  if (!admin) return { success: false, error: 'No autorizado' }
  if (!entries.length) return { success: false, error: 'Sin destinatarios' }

  const supabase = await createClient()
  const rows = entries.map((e) => ({ ...e, enviado_por: admin.id }))
  const { error } = await supabase.from('whatsapp_logs').insert(rows)
  if (error) return { success: false, error: error.message }
  return { success: true }
}
