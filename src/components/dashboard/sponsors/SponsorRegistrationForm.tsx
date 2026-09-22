'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { createSponsorAction } from '@/app/dashboard/sponsors/actions'

const sponsorSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  tier: z.enum(['platino', 'oro', 'plata', 'bronce', 'standard']),
  rubro: z.string().optional(),
  zona_influencia: z.string().optional(),
  resena: z.string().optional(),
  website_url: z.string().url('URL inválida').optional().or(z.literal('')),
  contact_name: z.string().optional(),
  apellido_contacto: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('Email inválido').optional().or(z.literal('')),
})

const fullSponsorSchema = sponsorSchema.extend({
  logo_monocromo: z.any().optional(),
  logo_color: z.any().optional(),
})

type SponsorFormValues = z.infer<typeof fullSponsorSchema>

interface Props {
  onClose: () => void
  onCreated?: (sponsor: any) => void
}

export default function SponsorRegistrationForm({ onClose, onCreated }: Props) {
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<SponsorFormValues>({
    resolver: zodResolver(fullSponsorSchema)
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Oculta el Vercel Toolbar mientras el modal está abierto (igual que Editar Sponsor)
  useEffect(() => {
    document.documentElement.classList.add('sponsor-form-open')
    return () => document.documentElement.classList.remove('sponsor-form-open')
  }, [])

  if (!isMounted) return null

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
  const inputErr = (msg?: string) => `${inputClass} ${msg ? 'border-red-500' : ''}`

  const uploadLogo = async (file: File | undefined, folder: string): Promise<string | null> => {
    if (!file) return null

    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileExt = cleanName.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const supabase = createClient()
    const { error } = await supabase.storage
      .from('sponsors-logos')
      .upload(filePath, file, { cacheControl: '3600', upsert: false })
    if (error) throw error
    return supabase.storage.from('sponsors-logos').getPublicUrl(filePath).data.publicUrl
  }

  const onSubmit = async (data: SponsorFormValues) => {
    setLoading(true)

    try {
      const logoMonocromoUrl = await uploadLogo(data.logo_monocromo?.[0], 'monocromo')
      const logoColorUrl = await uploadLogo(data.logo_color?.[0], 'color')

      const result = await createSponsorAction({
        name: data.name,
        tier: data.tier,
        rubro: data.rubro || null,
        resena: data.resena || null,
        website_url: data.website_url || null,
        email: data.contact_email || null,
        contacto_nombre: data.contact_name || null,
        contacto_telefono: data.contact_phone || null,
        logo_monocromo_url: logoMonocromoUrl,
        logo_color_url: logoColorUrl,
        is_active: true,
        description: null,
        // Columnas legacy (migración 036) — para consistencia con la ficha del admin
        nombre_empresa: data.name,
        actividad: data.rubro || null,
        zona_influencia: data.zona_influencia || null,
        nombre_contacto: data.contact_name || null,
        apellido_contacto: data.apellido_contacto || null,
        telefono: data.contact_phone || null,
      })

      if (!result.success) throw new Error('Error al guardar sponsor')
      onCreated?.(result.data)
      onClose()
    } catch (err: any) {
      alert('Error al registrar sponsor: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4' style={{ colorScheme: 'dark' }}>
      <div className='glass border border-white/10 rounded-2xl p-5 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center gap-2 mb-4'>
          <button
            type='button'
            onClick={onClose}
            className='p-1.5 hover:bg-white/5 rounded-full text-white/70 hover:text-white transition-colors'
            title='Volver'
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className='text-xl font-bold text-white uppercase tracking-wider'>Alta de Sponsors</h3>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-3'>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
            <div>
              <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-1'>Nombre Empresa *</label>
              <input className={inputErr(errors.name?.message)} {...register('name')} placeholder='Nombre del sponsor' />
              {errors.name && <p className='text-red-400 text-xs mt-1'>{errors.name.message}</p>}
            </div>

            <div>
              <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-1'>Categoría de Sponsoreo</label>
              <select className={`${inputClass} sponsor-form-select`} {...register('tier')}>
                <option value="platino">Platino</option>
                <option value="oro">Oro</option>
                <option value="plata">Plata</option>
                <option value="bronce">Bronce</option>
                <option value="standard">Standard</option>
              </select>
            </div>

            <div>
              <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-1'>Actividad</label>
              <input className={inputClass} {...register('rubro')} placeholder='Ej: tecnología, agroindustria, salud' />
            </div>

            <div>
              <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-1'>Zona de Influencia</label>
              <input className={inputClass} {...register('zona_influencia')} placeholder='Ej: regional, nacional, sector salud' />
            </div>

            <div>
              <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-1'>Nombre Contacto</label>
              <input className={inputClass} {...register('contact_name')} placeholder='Nombre del contacto' />
            </div>

            <div>
              <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-1'>Apellido Contacto</label>
              <input className={inputClass} {...register('apellido_contacto')} placeholder='Apellido del contacto' />
            </div>

            <div>
              <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-1'>Teléfono</label>
              <input className={inputClass} type='tel' {...register('contact_phone')} placeholder='Teléfono de contacto' />
            </div>

            <div>
              <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-1'>Email</label>
              <input type='email' className={inputErr(errors.contact_email?.message)} {...register('contact_email')} placeholder='Email de contacto' />
              {errors.contact_email && <p className='text-red-400 text-xs mt-1'>{errors.contact_email.message}</p>}
            </div>

            <div>
              <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-1'>Página Web</label>
              <input type='url' className={inputErr(errors.website_url?.message)} {...register('website_url')} placeholder='https://www.ejemplo.com' />
              {errors.website_url && <p className='text-red-400 text-xs mt-1'>{errors.website_url.message}</p>}
            </div>
          </div>

          <div>
            <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-1'>Reseña</label>
            <textarea rows={2} className={inputClass} {...register('resena')} placeholder='Breve reseña del sponsor' />
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div>
              <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-1'>Cargar Logo Blanco</label>
              <input type='file' accept='image/*' className='w-full text-xs text-white/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer' {...register('logo_monocromo')} />
            </div>
            <div>
              <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-1'>Cargar Logo Color</label>
              <input type='file' accept='image/*' className='w-full text-xs text-white/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer' {...register('logo_color')} />
            </div>
          </div>

          <div className='flex gap-3 pt-1'>
            <button type='button' onClick={onClose}
              className='flex-1 px-6 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-all text-sm'>
              Cancelar
            </button>
            <button type='submit' disabled={loading}
              className='flex-1 px-8 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-black'>
              {loading ? 'Guardando...' : 'Registrar Sponsor'}
            </button>
          </div>
        </form>

        <style jsx global>{`
          .sponsor-form-select {
            color-scheme: dark;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff88' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 0.75rem center;
            background-size: 1rem;
            padding-right: 2.5rem;
            cursor: pointer;
          }
          .sponsor-form-select option {
            background: #1a1a1a;
            color: #ffffff;
          }
          .sponsor-form-open vercel-toolbar {
            display: none !important;
          }
        `}</style>
      </div>
    </div>
  )
}