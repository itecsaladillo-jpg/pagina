'use client'

import { useState } from 'react'
import { createPollAction, togglePollStatusAction, deletePollAction } from './actions'
import { Plus, Trash2, Power, Play, BarChart2, Loader2, AlertCircle, Download, QrCode } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'react-qr-code'
import { useEffect } from 'react'

interface Poll {
  id: string
  question: string
  is_active: boolean
  poll_options: { id: string, text: string }[]
  poll_votes: { id: string }[]
}

export function PollManager({ initialPolls }: { initialPolls: Poll[] }) {
  const [polls, setPolls] = useState(initialPolls)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const downloadQR = (pollId: string, question: string) => {
    const svg = document.getElementById(`qr-${pollId}`)
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    // Nombre amigable para el archivo
    link.download = `QR_ITEC_${question.substring(0, 15).replace(/[^a-z0-9]/gi, '_')}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleAddOption = () => {
    setOptions([...options, ''])
  }

  const handleOptionChange = (index: number, val: string) => {
    const newOptions = [...options]
    newOptions[index] = val
    setOptions(newOptions)
  }

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) {
      setError('La pregunta es obligatoria.')
      return
    }
    const validOptions = options.filter(o => o.trim() !== '')
    if (validOptions.length < 2) {
      setError('Se necesitan al menos 2 opciones.')
      return
    }

    setLoading(true)
    setError(null)
    const res = await createPollAction(question, validOptions)
    if (res.success) {
      setQuestion('')
      setOptions(['', ''])
      window.location.reload()
    } else {
      setError(res.error || 'Error desconocido')
    }
    setLoading(false)
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const res = await togglePollStatusAction(id, !currentStatus)
    if (res.success) {
      window.location.reload()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de borrar esta encuesta?')) {
      const res = await deletePollAction(id)
      if (res.success) {
        window.location.reload()
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Creador */}
      <div className="glass border border-[var(--border-subtle)] rounded-2xl p-6 md:p-8">
        <h2 className="text-xl font-bold text-white mb-6">Crear Nueva Encuesta</h2>
        
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)] ml-1 mb-2 block">
              Pregunta
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ej: ¿Qué tecnología prefieren para el próximo taller?"
              className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white focus:border-[var(--accent-primary)] outline-none"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)] ml-1 block">
              Opciones
            </label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  placeholder={`Opción ${i + 1}`}
                  className="flex-1 bg-white/5 border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-sm text-white focus:border-[var(--accent-primary)] outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveOption(i)}
                  disabled={options.length <= 2}
                  className="p-2.5 rounded-xl text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={handleAddOption}
              className="flex items-center gap-2 text-[var(--accent-primary)] hover:text-white text-xs font-medium px-2 py-1 transition-colors"
            >
              <Plus size={14} /> Añadir opción
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
            Crear Encuesta
          </button>
        </form>
      </div>

      {/* Lista */}
      <div className="space-y-4">
        <h3 className="text-sm uppercase font-bold tracking-widest text-[var(--text-secondary)] ml-1">
          Encuestas Creadas
        </h3>
        
        {polls.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm italic p-4">No hay encuestas todavía.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {polls.map(poll => {
              const totalVotes = poll.poll_votes.length
              return (
                <div key={poll.id} className={`glass border rounded-2xl p-6 transition-all ${
                  poll.is_active ? 'border-[var(--accent-primary)] shadow-[0_0_20px_rgba(var(--accent-primary-rgb),0.15)]' : 'border-[var(--border-subtle)]'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-white font-bold leading-tight pr-4">{poll.question}</h4>
                    <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-white/5 text-[var(--text-muted)] flex items-center gap-1">
                      <BarChart2 size={12} /> {totalVotes}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    {poll.poll_options.map(opt => (
                      <div key={opt.id} className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--border-subtle)]"></div>
                        {opt.text}
                      </div>
                    ))}
                  </div>

                  {/* QR Code Section */}
                  {origin && (
                    <div className="flex items-center gap-4 mb-6 p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-16 h-16 bg-white rounded-lg p-1 shrink-0 flex items-center justify-center">
                        <QRCode
                          id={`qr-${poll.id}`}
                          value={`${origin}/votar`}
                          size={56}
                          style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                          viewBox={`0 0 56 56`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">Acceso Votación</p>
                        <p className="text-xs text-white truncate opacity-80">{origin}/votar</p>
                      </div>
                      <button
                        onClick={() => downloadQR(poll.id, poll.question)}
                        className="p-2.5 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 transition-all flex items-center gap-2"
                        title="Descargar QR"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(poll.id, poll.is_active)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                          poll.is_active 
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
                            : 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20'
                        }`}
                      >
                        <Power size={14} />
                        {poll.is_active ? 'Detener' : 'Lanzar Vivo'}
                      </button>

                      <Link 
                        href={`/dashboard/encuestas/${poll.id}/pantalla`}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/5 text-white hover:bg-white/10 transition-all"
                      >
                        <BarChart2 size={14} /> Pantalla
                      </Link>
                    </div>

                    <button
                      onClick={() => handleDelete(poll.id)}
                      className="p-2 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
