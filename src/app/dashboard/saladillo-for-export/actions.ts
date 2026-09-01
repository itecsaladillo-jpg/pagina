'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') {
    throw new Error('No autorizado')
  }
  return member
}

export async function aprobarTestimonioAction(id: string) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    const { error } = await supabase
      .from('saladillo_for_export')
      .update({ estado: 'aprobado' })
      .eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/saladillo-for-export')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function rechazarTestimonioAction(id: string) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    const { error } = await supabase
      .from('saladillo_for_export')
      .update({ estado: 'rechazado' })
      .eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/saladillo-for-export')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function setEmbajadorAction(id: string, orden: number | null) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    if (orden !== null) {
      const { data: existing } = await supabase
        .from('saladillo_for_export')
        .select('id')
        .eq('es_embajador', true)
        .eq('orden_embajador', orden)
        .neq('id', id)
        .maybeSingle()

      if (existing) {
        return { success: false, error: `La posición ${orden} ya está ocupada por otro embajador.` }
      }
    }

    const { error } = await supabase
      .from('saladillo_for_export')
      .update({
        es_embajador: orden !== null,
        orden_embajador: orden,
      })
      .eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/saladillo-for-export')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function crearTestimonioAdminAction(formData: FormData) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const nombre = formData.get('nombre')?.toString().trim()
    const foto_url = formData.get('foto_url')?.toString().trim()
    const ciudad_residencia = formData.get('ciudad_residencia')?.toString().trim()
    const pais_residencia = formData.get('pais_residencia')?.toString().trim()
    const escuela_origen = formData.get('escuela_origen')?.toString().trim()
    const profesion_rol = formData.get('profesion_rol')?.toString().trim()
    const mensaje_gratitud = formData.get('mensaje_gratitud')?.toString().trim()
    const es_embajador = formData.get('es_embajador') === 'true'
    const orden_embajador = formData.get('orden_embajador')?.toString()
    const estado = formData.get('estado')?.toString() || 'aprobado'

    if (!nombre || !foto_url || !ciudad_residencia || !pais_residencia || !escuela_origen || !profesion_rol || !mensaje_gratitud) {
      return { success: false, error: 'Todos los campos son obligatorios.' }
    }

    const foto = formData.get('foto') as File | null
    let finalFotoUrl = foto_url

    if (foto && foto.size > 0) {
      if (foto.size > 5 * 1024 * 1024) {
        return { success: false, error: 'La foto no puede superar 5 MB.' }
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(foto.type)) {
        return { success: false, error: 'Solo se aceptan archivos JPG, PNG o WebP.' }
      }

      const ext = foto.name.toLowerCase().split('.').pop() || 'jpg'
      const uniqueName = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const buffer = Buffer.from(await foto.arrayBuffer())

      const { error: uploadError } = await supabase.storage
        .from('saladillo-export-photos')
        .upload(uniqueName, buffer, { contentType: foto.type, upsert: false })

      if (uploadError) {
        return { success: false, error: `Error al subir la foto: ${uploadError.message}` }
      }

      const { data: urlData } = supabase.storage.from('saladillo-export-photos').getPublicUrl(uniqueName)
      finalFotoUrl = urlData.publicUrl
    }

    if (!finalFotoUrl) {
      return { success: false, error: 'De proporcionar una foto (subir archivo o URL).' }
    }

    if (es_embajador && orden_embajador) {
      const orden = Number(orden_embajador)
      const { data: existing } = await supabase
        .from('saladillo_for_export')
        .select('id')
        .eq('es_embajador', true)
        .eq('orden_embajador', orden)
        .maybeSingle()

      if (existing) {
        return { success: false, error: `La posición ${orden} ya está ocupada por otro embajador.` }
      }
    }

    const { error } = await supabase.from('saladillo_for_export').insert({
      nombre,
      foto_url: finalFotoUrl,
      ciudad_residencia,
      pais_residencia,
      escuela_origen,
      profesion_rol,
      mensaje_gratitud,
      es_embajador,
      orden_embajador: es_embajador && orden_embajador ? Number(orden_embajador) : null,
      estado,
    })

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/saladillo-for-export')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function eliminarTestimonioAction(id: string) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    const { error } = await supabase
      .from('saladillo_for_export')
      .delete()
      .eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/saladillo-for-export')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
