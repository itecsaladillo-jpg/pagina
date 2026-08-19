'use client'

import { useState } from 'react'
import { createSponsorAction, updateSponsorAction } from './actions'
import { z } from 'zod'

const sponsorSchema = z.object({
  nombre_empresa: z.string().min(1, 'Nombre empresa requerido'),
  tier: z.enum(['platino', 'oro', 'plata', 'bronce', 'standard']),
  actividad: z.string().optional(),
  zona_influencia: z.string().optional(),
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
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof SponsorFormData, string>>>({})
  const [formData, setFormData] = useState<SponsorFormData>({
    nombre_empresa: sponsor?.nombre_empresa || sponsor?.name || '',
    tier: sponsor?.tier || 'standard',
    actividad: sponsor?.actividad || sponsor?.rubro || '',
    zona_influencia: sponsor?.zona_influencia || '',
    nombre_contacto: sponsor?.nombre_contacto || sponsor?.contacto_nombre || '',
    apellido_contacto: sponsor?.apellido_contacto || '',
    telefono: sponsor?.telefono || sponsor?.contacto_telefono || '',
    email: sponsor?.email || sponsor?.contact_email || '',
  })

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
      const payload = {
        name: formData.nombre_empresa,
        tier: formData.tier,
        rubro: formData.actividad || '-',
        resena: sponsor?.resena ?? '',
        website_url: sponsor?.website_url ?? null,
        contacto_nombre: formData.nombre_contacto,
        contacto_telefono: formData.telefono,
        email: formData.email,
        logo_monocromo_url: sponsor?.logo_monocromo_url ?? '',
        logo_color_url: sponsor?.logo_color_url ?? '',
        is_active: sponsor?.is_active ?? true,
        description: sponsor?.description ?? null,
        // Columnas legacy (migración 036) — las fichas del admin leen de acá
        nombre_empresa: formData.nombre_empresa,
        actividad: formData.actividad || '-',
        zona_influencia: formData.zona_influencia || '-',
        nombre_contacto: formData.nombre_contacto,
        apellido_contacto: formData.apellido_contacto || '-',
        telefono: formData.telefono || '-',
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

          <div className='flex gap-4 pt-2'>
            <button type='button' onClick={() => onClose()}
              className='flex-1 px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-all text-sm'>
              Cancelar
            </button>
            <button type='submit' disabled={loading}
              className='flex-1 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black'>
              {loading ? 'Guardando...' : 'Guardar'}
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
        `}</style>
      </div>
    </div>
  )
}
