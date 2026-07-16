'use client'

import { useState } from 'react'
import { MedioForm } from './MedioForm'
import { deleteMedioAction } from './actions'
import { Edit, Trash2 } from 'lucide-react'

interface Props {
  initialMedios: any[]
}

export function MediosAdmin({ initialMedios }: Props) {
  const [medios, setMedios] = useState(initialMedios)
  const [showForm, setShowForm] = useState(false)
  const [editingMedio, setEditingMedio] = useState<any>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este medio?')) return
    await deleteMedioAction(id)
    setMedios(medios.filter(m => m.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => { setEditingMedio(null); setShowForm(true) }} className="btn-primary text-xs py-2 px-6 rounded-xl">
          + Nuevo Medio
        </button>
      </div>

      <div className="grid gap-4">
        {medios.map(m => (
          <div key={m.id} className="glass border border-white/5 rounded-xl p-5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white">{m.nombre_medio}</h3>
              <p className="text-[10px] text-[var(--text-muted)] uppercase">{m.tipo_medio} • {m.zona_influencia || 'Sin zona'}</p>
              <p className="text-xs text-white/60 mt-1">{m.nombre_contacto} {m.apellido_contacto}</p>
              <p className="text-xs text-emerald-400">{m.email}</p>
              {m.dial_radio && <p className="text-[10px] text-white/40">Dial: {m.dial_radio}</p>}
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setEditingMedio(m); setShowForm(true) }} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all">
                <Edit size={16} />
              </button>
              <button onClick={() => handleDelete(m.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-400 transition-all">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <MedioForm medio={editingMedio} onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}