'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { createSponsorAction } from '@/app/dashboard/sponsors/actions'

const sponsorSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  tier: z.enum(['platino', 'oro', 'plata', 'bronce', 'standard']),
  rubro: z.string().min(1, 'Rubro es requerido'),
  resena: z.string().min(1, 'Reseña es requerida'),
  website_url: z.string().url().optional().or(z.literal('')),
  contact_name: z.string().min(1, 'Nombre de contacto es requerido'),
  contact_phone: z.string().min(1, 'Teléfono es requerido'),
  contact_email: z.string().email('Email inválido'),
})

type SponsorFormValues = z.infer<typeof sponsorSchema> & {
  logo_monocromo: FileList
  logo_color: FileList
}

export default function SponsorRegistrationForm() {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<SponsorFormValues>({
    resolver: zodResolver(sponsorSchema.extend({
      logo_monocromo: z.any().refine((files) => files?.length > 0, 'Logo monocromo es requerido'),
      logo_color: z.any().refine((files) => files?.length > 0, 'Logo color es requerido'),
    }))
  })

  const onSubmit = async (data: SponsorFormValues) => {
    setLoading(true)
    const supabase = createClient()

    try {
      // Upload files
      const upload = async (file: File, folder: string) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
        const { error } = await supabase.storage
          .from('sponsors-logos')
          .upload(`${folder}/${fileName}`, file)
        if (error) throw error
        return supabase.storage.from('sponsors-logos').getPublicUrl(`${folder}/${fileName}`).data.publicUrl
      }

      const logoMonocromoUrl = await upload(data.logo_monocromo[0], 'monocromo')
      const logoColorUrl = await upload(data.logo_color[0], 'color')

      // Insert Sponsor
      const result = await createSponsorAction({
        name: data.name,
        tier: data.tier,
        rubro: data.rubro,
        resena: data.resena,
        website_url: data.website_url || null,
        email: data.contact_email,
        contacto_nombre: data.contact_name,
        contacto_telefono: data.contact_phone,
        logo_monocromo_url: logoMonocromoUrl,
        logo_color_url: logoColorUrl,
        is_active: true,
        description: null,
      })

      if (!result.success) throw new Error('Error al guardar sponsor')
      alert('Sponsor registrado exitosamente')
    } catch (err: any) {
      alert('Error al registrar sponsor: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 bg-gray-900 rounded-lg text-white">
      <input {...register('name')} placeholder="Nombre del Sponsor" className="w-full p-2 bg-gray-800 rounded" />
      {errors.name && <p className="text-red-500">{errors.name.message}</p>}
      
      <select {...register('tier')} className="w-full p-2 bg-gray-800 rounded">
        <option value="platino">Platinum</option>
        <option value="oro">Oro</option>
        <option value="plata">Plata</option>
        <option value="bronce">Bronce</option>
        <option value="standard">Standard</option>
      </select>

      <input {...register('rubro')} placeholder="Rubro" className="w-full p-2 bg-gray-800 rounded" />
      <textarea {...register('resena')} placeholder="Reseña" className="w-full p-2 bg-gray-800 rounded" />
      <input {...register('website_url')} placeholder="Página Web" className="w-full p-2 bg-gray-800 rounded" />
      <input {...register('contact_name')} placeholder="Contacto" className="w-full p-2 bg-gray-800 rounded" />
      <input {...register('contact_phone')} placeholder="Teléfono" className="w-full p-2 bg-gray-800 rounded" />
      <input {...register('contact_email')} placeholder="Email" className="w-full p-2 bg-gray-800 rounded" />
      
      <input type="file" {...register('logo_monocromo')} className="w-full" />
      <input type="file" {...register('logo_color')} className="w-full" />
      
      <button type="submit" disabled={loading} className="w-full p-2 bg-blue-600 rounded">
        {loading ? 'Guardando...' : 'Registrar Sponsor'}
      </button>
    </form>
  )
}
