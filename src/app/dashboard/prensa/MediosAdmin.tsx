'use client'

import { useState } from 'react'
import { MedioForm } from './MedioForm'
import { deleteMedioAction } from './actions'
import { FileText, Edit, Trash2, ExternalLink } from 'lucide-react'

interface Props {
  initialMedios: any[]
  latestPressRelease: string | null
}

export function MediosAdmin({ initialMedios, latestPressRelease }: Props) {
  const [medios, setMedios] = useState(initialMedios)
  const [showForm, setShowForm] = useState(false)
  const [editingMedio, setEditingMedio] = useState<any>(null)
  const [showGacetilla, setShowGacetilla] = useState(false)

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
              {latestPressRelease && (
                <button onClick={() => setShowGacetilla(true)} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all" title="Enviar gacetilla">
                  <FileText size={16} />
                </button>
              )}
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

      {showGacetilla && latestPressRelease && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass border border-white/10 rounded-2xl p-8 max-w-2xl w-full">
            <h3 className="text-xl font-bold text-white mb-4">Gacetilla para Prensa</h3>
            <pre className="whitespace-pre-wrap text-sm text-white/80 mb-6 max-h-96 overflow-y-auto">{latestPressRelease}</pre>
            <button onClick={() => setShowGacetilla(false)} className="btn-primary w-full py-3 rounded-xl">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}