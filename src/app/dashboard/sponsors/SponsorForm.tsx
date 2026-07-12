'use client'

import { useState } from 'react'
import { createSponsorAction, updateSponsorAction } from './actions'
import { z } from 'zod'

const sponsorSchema = z.object({
  nombre_empresa: z.string().min(1, 'Nombre empresa requerido'),
  actividad: z.string().optional(),
  zona_influencia: z.string().optional(),
  nombre_contacto: z.string().min(1, 'Nombre contacto requerido'),
  apellido_contacto: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').min(1, 'Email requerido'),
})

type SponsorFormData = z.infer<typeof sponsorSchema>

interface Props {
  sponsor?: any
  onClose: () => void
}

export function SponsorForm({ sponsor, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof SponsorFormData, string>>>({})
const [formData, setFormData] = useState<SponsorFormData>({
    nombre_empresa: sponsor?.nombre_empresa || sponsor?.name || '',
    actividad: sponsor?.actividad || '',
    zona_influencia: sponsor?.zona_influencia || '',
    nombre_contacto: sponsor?.nombre_contacto || '',
    apellido_contacto: sponsor?.apellido_contacto || '',
    telefono: sponsor?.telefono || '',
    email: sponsor?.email || '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const result = sponsorSchema.safeParse(formData)
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
        ...formData,
        name: formData.nombre_empresa,
      }
      if (sponsor) {
        await updateSponsorAction(sponsor.id, payload)
      } else {
        await createSponsorAction(payload)
      }
      onClose()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
    setLoading(false)
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"

  return (
    <div className='fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='glass border border-white/10 rounded-2xl p-8 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto'>
        <h3 className='text-2xl font-bold text-white mb-6'>
          {sponsor ? 'Editar Sponsor' : 'Nuevo Sponsor'}
        </h3>

        <form onSubmit={handleSubmit} className='space-y-5'>
          <div>
            <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-2'>Nombre Empresa *</label>
            <input required className={`${inputClass} ${errors.nombre_empresa ? 'border-red-500' : ''}`}
              value={formData.nombre_empresa}
              onChange={e => setFormData({ ...formData, nombre_empresa: e.target.value })} />
            {errors.nombre_empresa && <p className='text-red-400 text-xs mt-1'>{errors.nombre_empresa}</p>}
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
              <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-2'>Nombre Contacto *</label>
              <input required className={`${inputClass} ${errors.nombre_contacto ? 'border-red-500' : ''}`}
                value={formData.nombre_contacto}
                onChange={e => setFormData({ ...formData, nombre_contacto: e.target.value })} />
              {errors.nombre_contacto && <p className='text-red-400 text-xs mt-1'>{errors.nombre_contacto}</p>}
            </div>
            <div>
              <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-2'>Apellido Contacto *</label>
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
            <label className='block text-[10px] uppercase tracking-widest text-white/60 mb-2'>Email *</label>
            <input required type='email' className={`${inputClass} ${errors.email ? 'border-red-500' : ''}`}
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })} />
            {errors.email && <p className='text-red-400 text-xs mt-1'>{errors.email}</p>}
            <p className='text-[10px] text-white/40 mt-1'>Se usará para envío de links de comunicación</p>
          </div>

          <div className='flex gap-4 pt-2'>
            <button type='button' onClick={onClose}
              className='flex-1 px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-all text-sm'>
              Cancelar
            </button>
            <button type='submit' disabled={loading}
              className='flex-1 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black'>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}