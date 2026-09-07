'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createMedioAction, updateMedioAction } from './actions'
import { createClient } from '@/lib/supabase/client'

const medioSchema = z.object({
  nombre_medio: z.string().min(1, 'Nombre del medio requerido'),
  tipo_medio: z.enum(['Radio', 'Diario Papel', 'Portal Web', 'TV']),
  url_web: z.string().optional(),
  dial_radio: z.string().optional(),
  zona_influencia: z.string().optional(),
  nombre_contacto: z.string().min(1, 'Nombre contacto requerido'),
  apellido_contacto: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').min(1, 'Email requerido'),
})

type MedioFormData = z.infer<typeof medioSchema>

interface Props {
  medio?: any
  onClose: () => void
}

export function MedioForm({ medio, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(medio?.logo_url || null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<MedioFormData>({
    resolver: zodResolver(medioSchema),
    defaultValues: {
      nombre_medio: medio?.nombre_medio || '',
      tipo_medio: medio?.tipo_medio || 'Portal Web',
      url_web: medio?.url_web || '',
      dial_radio: medio?.dial_radio || '',
      zona_influencia: medio?.zona_influencia || '',
      nombre_contacto: medio?.nombre_contacto || '',
      apellido_contacto: medio?.apellido_contacto || '',
      telefono: medio?.telefono || '',
      email: medio?.email || '',
    }
  })

  const tipoMedio = watch('tipo_medio')

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const uploadLogo = async (file: File): Promise<string> => {
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileExt = cleanName.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `medios-logos/${fileName}`

    const supabase = createClient()
    const { error } = await supabase.storage
      .from('sponsors-logos')
      .upload(filePath, file, { cacheControl: '3600', upsert: false })
    if (error) throw error
    return supabase.storage.from('sponsors-logos').getPublicUrl(filePath).data.publicUrl
  }

  const onSubmit = async (data: MedioFormData) => {
    setLoading(true)
    try {
      let logoUrl = medio?.logo_url || null

      if (logoFile) {
        setUploadingLogo(true)
        logoUrl = await uploadLogo(logoFile)
        setUploadingLogo(false)
      }

      const payload = { ...data, logo_url: logoUrl }

      if (medio) {
        await updateMedioAction(medio.id, payload)
      } else {
        await createMedioAction(payload)
      }
      onClose()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass border border-white/10 rounded-2xl p-8 max-w-xl w-full">
        <h3 className="text-2xl font-bold text-white mb-6">
          {medio ? 'Editar Medio' : 'Nuevo Medio de Prensa'}
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Nombre del Medio *</label>
            <input {...register('nombre_medio')} className="w-full input-field" />
            {errors.nombre_medio && <p className="text-red-400 text-xs">{errors.nombre_medio.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Tipo de Medio *</label>
            <select {...register('tipo_medio')} className="w-full input-field">
              <option value="Radio">Radio</option>
              <option value="Diario Papel">Diario Papel</option>
              <option value="Portal Web">Portal Web</option>
              <option value="TV">TV</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Logo del Medio</label>
            <div className="flex items-center gap-4">
              {logoPreview && (
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain bg-white" />
                </div>
              )}
              <label className="flex-1">
                <span className="block w-full input-field text-center cursor-pointer text-sm">
                  {logoPreview ? 'Cambiar logo' : 'Seleccionar logo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-white/40 text-xs mt-1">Formatos: JPG, PNG, SVG. Tamaño máximo recomendado: 500KB</p>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Zona de Influencia</label>
            <input {...register('zona_influencia')} className="w-full input-field" placeholder="Ej: Saladillo centro, regional" />
          </div>

          {tipoMedio === 'Radio' && (
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Dial Radio</label>
              <input {...register('dial_radio')} className="w-full input-field" placeholder="Ej: 101.5 FM" />
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">URL Web</label>
            <input {...register('url_web')} className="w-full input-field" placeholder="www.ejemplo.com" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Nombre Contacto *</label>
              <input {...register('nombre_contacto')} className="w-full input-field" />
              {errors.nombre_contacto && <p className="text-red-400 text-xs">{errors.nombre_contacto.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Apellido Contacto</label>
              <input {...register('apellido_contacto')} className="w-full input-field" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Teléfono</label>
              <input {...register('telefono')} className="w-full input-field" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-2">Email *</label>
              <input {...register('email')} className="w-full input-field" type="email" />
              {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white">Cancelar</button>
            <button type="submit" disabled={loading || uploadingLogo} className="flex-1 btn-primary py-3 rounded-xl">
              {loading ? 'Guardando...' : uploadingLogo ? 'Subiendo logo...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}