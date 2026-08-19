'use client'

import { useState, useEffect } from 'react'
import { createSponsorAction, updateSponsorAction } from './actions'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

const sponsorSchema = z.object({
  nombre_empresa: z.string().min(1, 'Nombre empresa requerido'),
  tier: z.enum(['platino', 'oro', 'plata', 'bronce', 'standard']),
  actividad: z.string().optional(),
  zona_influencia: z.string().optional(),
  website_url: z.union([z.string().url('URL inválida'), z.literal('')]).optional(),
  nombre_contacto: z.string().min(1, 'Nombre contacto requerido'),
  apellido_contacto: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').min(1, 'Email requerido'),
})

// Al editar se permite guardar con campos vacíos
const editSchema = z.object({
  nombre_empresa: z.string().optional(),
  tier: z.enum(['platino', 'oro', 'plata', 'bronce', 'standard']),
  actividad: z.string().optional(),
  zona_influencia: z.string().optional(),
  website_url: z.union([z.string().url('URL inválida'), z.literal('')]).optional(),
  nombre_contacto: z.string().optional(),
  apellido_contacto: z.string().optional(),
  telefono: z.string().optional(),
  email: z.union([z.string().email('Email inválido'), z.literal('')]).optional(),
})

type SponsorFormData = z.infer<typeof sponsorSchema>

const TIERS: { value: SponsorFormData['tier']; label: string }[] = [
  { value: 'platino', label: 'Platino' },
  { value: 'oro', label: 'Oro' },
  { value: 'plata', label: 'Plata' },
  { value: 'bronce', label: 'Bronce' },
  { value: 'standard', label: 'Standard' },
]

interface Props {
  sponsor?: any
  onClose: (updated?: any) => void
}

export function SponsorForm({ sponsor, onClose }: Props) {
  // Trata '-' como vacío (placeholders guardados por versiones anteriores del form)
  const clean = (v?: string | null) => (v && v !== '-' ? v : '')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof SponsorFormData, string>>>({})
  const [formData, setFormData] = useState<SponsorFormData>({
    nombre_empresa: sponsor?.nombre_empresa || sponsor?.name || '',
    tier: sponsor?.tier || 'standard',
    actividad: clean(sponsor?.actividad) || clean(sponsor?.rubro),
    zona_influencia: clean(sponsor?.zona_influencia),
    website_url: sponsor?.website_url || '',
    nombre_contacto: clean(sponsor?.nombre_contacto) || clean(sponsor?.contacto_nombre),
    apellido_contacto: clean(sponsor?.apellido_contacto),
    telefono: clean(sponsor?.telefono) || clean(sponsor?.contacto_telefono),
    email: sponsor?.email || sponsor?.contact_email || '',
  })

  // Oculta el Vercel Toolbar mientras el modal está abierto (lo restaura al cerrar)
  useEffect(() => {
    document.documentElement.classList.add('sponsor-form-open')
    return () => document.documentElement.classList.remove('sponsor-form-open')
  }, [])

  // Logos: miniatura del actual + archivo nuevo que lo reemplaza
  const [logoMonocromo, setLogoMonocromo] = useState<File | null>(null)
  const [logoColor, setLogoColor] = useState<File | null>(null)
  const [logoMonocromoPreview, setLogoMonocromoPreview] = useState<string | null>(sponsor?.logo_monocromo_url || null)
  const [logoColorPreview, setLogoColorPreview] = useState<string | null>(sponsor?.logo_color_url || null)
  const [uploadingLogos, setUploadingLogos] = useState(false)

  const handleLogoChange = (file: File | null, tipo: 'monocromo' | 'color') => {
    if (tipo === 'monocromo') {
      setLogoMonocromo(file)
      setLogoMonocromoPreview(file ? URL.createObjectURL(file) : (sponsor?.logo_monocromo_url || null))
    } else {
      setLogoColor(file)
      setLogoColorPreview(file ? URL.createObjectURL(file) : (sponsor?.logo_color_url || null))
    }
  }

  const uploadLogo = async (file: File, folder: string): Promise<string> => {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = (sponsor ? editSchema : sponsorSchema).safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof SponsorFormData
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    setErrors({})
    try {
      // Subir logos nuevos (si se eligieron) — reemplazan los actuales
      setUploadingLogos(true)
      const logoMonocromoUrl = logoMonocromo
        ? await uploadLogo(logoMonocromo, 'monocromo')
        : (sponsor?.logo_monocromo_url ?? null)
      const logoColorUrl = logoColor
        ? await uploadLogo(logoColor, 'color')
        : (sponsor?.logo_color_url ?? null)

      const payload = {
        name: formData.nombre_empresa,
        tier: formData.tier,
        rubro: formData.actividad || null,
        resena: sponsor?.resena ?? '',
        website_url: (formData.website_url || '').trim() || null,
        contacto_nombre: formData.nombre_contacto || null,
        contacto_telefono: formData.telefono || null,
        // Email vacío → null: la columna email es UNIQUE y NULL no colisiona con otros vacíos
        email: formData.email.trim() || null,
        logo_monocromo_url: logoMonocromoUrl,
        logo_color_url: logoColorUrl,
        is_active: sponsor?.is_active ?? true,
        description: sponsor?.description ?? null,
        // Columnas legacy (migración 036) — las fichas del admin leen de acá
        nombre_empresa: formData.nombre_empresa,
        actividad: formData.actividad || null,
        zona_influencia: formData.zona_influencia || null,
        nombre_contacto: formData.nombre_contacto || null,
        apellido_contacto: formData.apellido_contacto || null,
        telefono: formData.telefono || null,
      }
      if (sponsor) {
        const res = await updateSponsorAction(sponsor.id, payload)
        onClose(res.data ?? { ...sponsor, ...payload })
      } else {
        await createSponsorAction(payload)
        onClose()
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
    setLoading(false)
    setUploadingLogos(false)
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"

  return (
    <div className='fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4' style={{ colorScheme: 'dark' }}>
      <div className='glass border border-white/10 rounded-2xl p-8 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={() => onClose()}
              className='p-2 hover:bg-white/5 rounded-full text-white/70 hover:text-white transition-colors'
              title='Volver'
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className='text-2xl font-bold text-white'>
              {sponsor ? 'Editar Sponsor' : 'Nuevo Sponsor'}
            </h3>
          </div>
          {sponsor && (
            <a href={`/sponsors/${sponsor.id}`} target="_blank"
              className='text-[10px] text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-all'>
              Ver portal →
            </a>
          )}
        </div>

        <form onSubmit={handleSubmit} className='space-y-5'>
          <div>
            <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-2'>Nombre Empresa</label>
            <input className={`${inputClass} ${errors.nombre_empresa ? 'border-red-500' : ''}`}
              value={formData.nombre_empresa}
              onChange={e => setFormData({ ...formData, nombre_empresa: e.target.value })} />
            {errors.nombre_empresa && <p className='text-red-400 text-xs mt-1'>{errors.nombre_empresa}</p>}
          </div>

          <div>
            <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-2'>Categoría de Sponsoreo</label>
            <select className={`${inputClass} sponsor-form-select`} value={formData.tier}
              onChange={e => setFormData({ ...formData, tier: e.target.value as SponsorFormData['tier'] })}>
              {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-2'>Actividad</label>
            <input className={inputClass}
              placeholder='Ej: tecnología, agroindustria, salud'
              value={formData.actividad}
              onChange={e => setFormData({ ...formData, actividad: e.target.value })} />
          </div>

          <div>
            <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-2'>Zona de Influencia</label>
            <input className={inputClass}
              placeholder='Ej: regional, nacional, sector salud'
              value={formData.zona_influencia}
              onChange={e => setFormData({ ...formData, zona_influencia: e.target.value })} />
          </div>

          <div>
            <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-2'>Página Web</label>
            <input type='url' className={`${inputClass} ${errors.website_url ? 'border-red-500' : ''}`}
              placeholder='https://www.ejemplo.com'
              value={formData.website_url}
              onChange={e => setFormData({ ...formData, website_url: e.target.value })} />
            {errors.website_url && <p className='text-red-400 text-xs mt-1'>{errors.website_url}</p>}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-2'>Nombre Contacto</label>
              <input className={`${inputClass} ${errors.nombre_contacto ? 'border-red-500' : ''}`}
                value={formData.nombre_contacto}
                onChange={e => setFormData({ ...formData, nombre_contacto: e.target.value })} />
              {errors.nombre_contacto && <p className='text-red-400 text-xs mt-1'>{errors.nombre_contacto}</p>}
            </div>
            <div>
              <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-2'>Apellido Contacto</label>
              <input className={`${inputClass} ${errors.apellido_contacto ? 'border-red-500' : ''}`}
                value={formData.apellido_contacto}
                onChange={e => setFormData({ ...formData, apellido_contacto: e.target.value })} />
              {errors.apellido_contacto && <p className='text-red-400 text-xs mt-1'>{errors.apellido_contacto}</p>}
            </div>
          </div>

          <div>
            <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-2'>Teléfono</label>
            <input className={inputClass} type='tel'
              value={formData.telefono}
              onChange={e => setFormData({ ...formData, telefono: e.target.value })} />
          </div>

          <div>
            <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-2'>Email</label>
            <input type='email' className={`${inputClass} ${errors.email ? 'border-red-500' : ''}`}
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })} />
            {errors.email && <p className='text-red-400 text-xs mt-1'>{errors.email}</p>}
            <p className='text-[10px] text-white/40 mt-1'>Se usará para envío de links de comunicación</p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-2'>Logo Blanco</label>
              {logoMonocromoPreview && (
                <div className='mb-2 rounded-xl border border-white/10 bg-white/5 p-3 flex items-center justify-center min-h-[64px]'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoMonocromoPreview} alt='Logo blanco' className='max-h-12 max-w-full object-contain' />
                </div>
              )}
              <input type='file' accept='image/*' className='w-full text-xs text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer'
                onChange={e => handleLogoChange(e.target.files?.[0] || null, 'monocromo')} />
              <p className='text-[10px] text-white/40 mt-1'>Subí una imagen para reemplazar el logo actual</p>
            </div>
            <div>
              <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-2'>Logo Color</label>
              {logoColorPreview && (
                <div className='mb-2 rounded-xl border border-white/10 bg-white/5 p-3 flex items-center justify-center min-h-[64px]'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoColorPreview} alt='Logo color' className='max-h-12 max-w-full object-contain' />
                </div>
              )}
              <input type='file' accept='image/*' className='w-full text-xs text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer'
                onChange={e => handleLogoChange(e.target.files?.[0] || null, 'color')} />
              <p className='text-[10px] text-white/40 mt-1'>Subí una imagen para reemplazar el logo actual</p>
            </div>
          </div>

          <div className='flex gap-4 pt-2'>
            <button type='button' onClick={() => onClose()}
              className='flex-1 px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-all text-sm'>
              Cancelar
            </button>
            <button type='submit' disabled={loading || uploadingLogos}
              className='flex-1 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black'>
              {loading || uploadingLogos ? 'Guardando...' : 'Guardar'}
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
