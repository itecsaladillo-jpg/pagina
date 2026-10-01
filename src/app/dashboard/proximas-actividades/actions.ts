'use server'

import { getCurrentMember } from '@/services/auth'
import {
  createProximaActividad,
  updateProximaActividad,
  deleteProximaActividad,
} from '@/services/proximasActividades'
import { revalidatePath } from 'next/cache'

async function assertAuthorized() {
  const member = await getCurrentMember()
  if (!member || (member.role !== 'admin' && member.role !== 'coordinador')) {
    throw new Error('No autorizado para gestionar próximas actividades')
  }
  return member
}

export async function createActividadAction(data: {
  titulo: string
  lugar: string
  fecha: string
}) {
  await assertAuthorized()

  if (!data.titulo || !data.titulo.trim()) {
    return { success: false, error: 'El título es obligatorio' }
  }
  if (!data.lugar || !data.lugar.trim()) {
    return { success: false, error: 'El lugar es obligatorio' }
  }
  if (!data.fecha) {
    return { success: false, error: 'La fecha es obligatoria' }
  }

  const result = await createProximaActividad({
    titulo: data.titulo.trim(),
    lugar: data.lugar.trim(),
    fecha: new Date(data.fecha).toISOString(),
  })

  if (result.success) {
    revalidatePath('/')
    revalidatePath('/dashboard/proximas-actividades')
  }

  return result
}

export async function updateActividadAction(
  id: string,
  data: {
    titulo: string
    lugar: string
    fecha: string
  }
) {
  await assertAuthorized()

  if (!id) {
    return { success: false, error: 'ID inválido' }
  }
  if (!data.titulo || !data.titulo.trim()) {
    return { success: false, error: 'El título es obligatorio' }
  }
  if (!data.lugar || !data.lugar.trim()) {
    return { success: false, error: 'El lugar es obligatorio' }
  }
  if (!data.fecha) {
    return { success: false, error: 'La fecha es obligatoria' }
  }

  const result = await updateProximaActividad(id, {
    titulo: data.titulo.trim(),
    lugar: data.lugar.trim(),
    fecha: new Date(data.fecha).toISOString(),
  })

  if (result.success) {
    revalidatePath('/')
    revalidatePath('/dashboard/proximas-actividades')
  }

  return result
}

export async function deleteActividadAction(id: string) {
  await assertAuthorized()

  if (!id) {
    return { success: false, error: 'ID inválido' }
  }

  const result = await deleteProximaActividad(id)

  if (result.success) {
    revalidatePath('/')
    revalidatePath('/dashboard/proximas-actividades')
  }

  return result
}
