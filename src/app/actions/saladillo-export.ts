'use server'

import { createClient } from '@supabase/supabase-js'

const BUCKET = 'saladillo-export-photos'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function crearTestimonioSaladilloExport(formData: FormData) {
  try {
    const nombre = formData.get('nombre')?.toString().trim()
    const foto = formData.get('foto') as File | null
    const ciudad_residencia = formData.get('ciudad_residencia')?.toString().trim()
    const pais_residencia = formData.get('pais_residencia')?.toString().trim()
    const escuela_origen = formData.get('escuela_origen')?.toString().trim()
    const profesion_rol = formData.get('profesion_rol')?.toString().trim()
    const mensaje_gratitud = formData.get('mensaje_gratitud')?.toString().trim()

    if (!nombre || !foto || !ciudad_residencia || !pais_residencia || !escuela_origen || !profesion_rol || !mensaje_gratitud) {
      return { success: false, error: 'Todos los campos son obligatorios.' }
    }

    if (foto.size > 5 * 1024 * 1024) {
      return { success: false, error: 'La foto no puede superar 5 MB.' }
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(foto.type)) {
      return { success: false, error: 'Solo se aceptan archivos JPG, PNG o WebP.' }
    }

    const supabase = getSupabase()

    const ext = foto.name.toLowerCase().split('.').pop() || 'jpg'
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const buffer = Buffer.from(await foto.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(uniqueName, buffer, {
        contentType: foto.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[crearTestimonioSaladilloExport] Storage error:', uploadError)
      return { success: false, error: `Error al subir la foto: ${uploadError.message}` }
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uniqueName)
    const foto_url = urlData.publicUrl

    const { error: insertError } = await supabase
      .from('saladillo_for_export')
      .insert({
        nombre,
        foto_url,
        ciudad_residencia,
        pais_residencia,
        escuela_origen,
        profesion_rol,
        mensaje_gratitud,
        es_embajador: false,
        orden_embajador: null,
        estado: 'pendiente',
      })

    if (insertError) {
      console.error('[crearTestimonioSaladilloExport] Insert error:', insertError)
      return { success: false, error: `Error al guardar el testimonio: ${insertError.message}` }
    }

    return { success: true }
  } catch (err: any) {
    console.error('[crearTestimonioSaladilloExport] Error:', err)
    return { success: false, error: err?.message || 'Error interno del servidor.' }
  }
}
