'use client'

import { useState, useEffect } from 'react'
import { createPollAction, togglePollStatusAction, deletePollAction, updatePollAction } from './actions'
import { Plus, Trash2, Power, Play, BarChart2, Loader2, AlertCircle, Download, QrCode, Pencil, X } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'react-qr-code'

interface PollOption {
  id: string
  text: string
  poll_votes: { id: string }[]
}

interface PollQuestion {
  id: string
  text: string
  chart_type: 'bar' | 'pie' | 'doughnut' | 'radar' | 'area'
  poll_options: PollOption[]
}

interface Poll {
  id: string
  name: string
  is_active: boolean
  poll_questions: PollQuestion[]
}

export function PollManager({ initialPolls }: { initialPolls: Poll[] }) {
  const [polls, setPolls] = useState<Poll[]>(initialPolls || [])
  const [editingPollId, setEditingPollId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [questions, setQuestions] = useState<{ id?: string, text: string, options: { id?: string, text: string }[], chart_type: 'bar' | 'pie' | 'doughnut' | 'radar' | 'area' }[]>([{ text: '', options: [{ text: '' }, { text: '' }], chart_type: 'bar' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const downloadQR = (pollId: string, pollName: string) => {
    const svg = document.getElementById(`qr-${pollId}`)
    if (!svg) return

    const innerSvg = svg.cloneNode(true) as SVGElement
    innerSvg.removeAttribute('style')
    innerSvg.removeAttribute('id')
    innerSvg.setAttribute('width', '100%')
    innerSvg.setAttribute('height', '100%')

    const innerSvgData = new XMLSerializer().serializeToString(innerSvg)

    const wrapperSvgData = `
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="background-color: white;">
        <svg x="33.33%" y="33.33%" width="33.33%" height="33.33%">
          ${innerSvgData}
        </svg>
      </svg>
    `.trim()

    const blob = new Blob([wrapperSvgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `QR_ITEC_${pollName.substring(0, 15).replace(/[^a-z0-9]/gi, '_')}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: '', options: [{ text: '' }, { text: '' }], chart_type: 'bar' }])
  }

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) return
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const handleQuestionChange = (index: number, val: string) => {
    const newQ = [...questions]
    newQ[index].text = val
    setQuestions(newQ)
  }

  const handleChartTypeChange = (index: number, val: 'bar' | 'pie' | 'doughnut' | 'radar' | 'area') => {
    const newQ = [...questions]
    newQ[index].chart_type = val
    setQuestions(newQ)
  }

  const handleAddOption = (qIndex: number) => {
    const newQ = [...questions]
    newQ[qIndex].options.push({ text: '' })
    setQuestions(newQ)
  }

  const handleOptionChange = (qIndex: number, optIndex: number, val: string) => {
    const newQ = [...questions]
    newQ[qIndex].options[optIndex].text = val
    setQuestions(newQ)
  }

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    const newQ = [...questions]
    if (newQ[qIndex].options.length <= 2) return
    newQ[qIndex].options = newQ[qIndex].options.filter((_, i) => i !== optIndex)
    setQuestions(newQ)
  }

  const startEdit = (poll: Poll) => {
    setEditingPollId(poll.id)
    setName(poll.name)
    setQuestions(poll.poll_questions.map(q => ({
      id: q.id,
      text: q.text,
      chart_type: q.chart_type || 'bar',
      options: q.poll_options.map(o => ({ id: o.id, text: o.text }))
    })))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingPollId(null)
    setName('')
    setQuestions([{ text: '', options: [{ text: '' }, { text: '' }], chart_type: 'bar' }])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('El nombre de la encuesta es obligatorio.')
      return
    }

    if (editingPollId) {
      const validQuestions = questions.map(q => ({
        id: q.id,
        text: q.text.trim(),
        chart_type: q.chart_type,
        options: q.options.filter(o => o.text.trim() !== '').map(o => ({ id: o.id, text: o.text.trim() }))
      })).filter(q => q.text !== '' && q.options.length >= 2)

      if (validQuestions.length === 0) {
        setError('Debes agregar al menos una pregunta válida con al menos 2 opciones.')
        return
      }

      setLoading(true)
      setError(null)
      const res = await updatePollAction(editingPollId, name, validQuestions)
      if (res.success) {
        setEditingPollId(null)
        setName('')
        setQuestions([{ text: '', options: [{ text: '' }, { text: '' }], chart_type: 'bar' }])
        window.location.reload()
      } else {
        setError(res.error || 'Error desconocido')
      }
      setLoading(false)
    } else {
      const validQuestions = questions.map(q => ({
        text: q.text.trim(),
        chart_type: q.chart_type,
        options: q.options.filter(o => o.text.trim() !== '').map(o => o.text.trim())
      })).filter(q => q.text !== '' && q.options.length >= 2)

      if (validQuestions.length === 0) {
        setError('Debes agregar al menos una pregunta válida con al menos 2 opciones.')
        return
      }

      setLoading(true)
      setError(null)
      const res = await createPollAction(name, validQuestions)
      if (res.success) {
        setName('')
        setQuestions([{ text: '', options: [{ text: '' }, { text: '' }], chart_type: 'bar' }])
        window.location.reload()
      } else {
        setError(res.error || 'Error desconocido')
      }
      setLoading(false)
    }
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {editingPollId ? 'Editar Encuesta' : 'Crear Nueva Encuesta'}
          </h2>
          {editingPollId && (
            <button
              onClick={cancelEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white transition-all"
            >
              <X size={14} /> Cancelar Edición
            </button>
          )}
        </div>
        
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)] ml-1 mb-2 block">
              Nombre de la Encuesta
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Encuesta de Satisfacción General"
              className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white focus:border-[var(--accent-primary)] outline-none"
            />
          </div>

          <div className="space-y-6 border-t border-[var(--border-subtle)] pt-6">
            <label className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)] ml-1 block">
              Preguntas
            </label>
            
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="p-4 bg-black/20 border border-[var(--border-subtle)] rounded-xl space-y-4 relative">
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIndex)}
                    className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)] ml-1 mb-1 block">Enunciado</label>
                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                      placeholder={`Pregunta ${qIndex + 1}`}
                      className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-lg px-4 py-2 text-white focus:border-[var(--accent-primary)] outline-none"
                    />
                  </div>
                  <div className="md:w-48">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)] ml-1 mb-1 block">Tipo de Gráfico</label>
                    <select
                      value={q.chart_type}
                      onChange={(e) => handleChartTypeChange(qIndex, e.target.value as any)}
                      className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-lg px-4 py-2 text-white focus:border-[var(--accent-primary)] outline-none appearance-none"
                    >
                      <option value="bar" className="bg-gray-900 text-white">Barras</option>
                      <option value="pie" className="bg-gray-900 text-white">Torta</option>
                      <option value="doughnut" className="bg-gray-900 text-white">Anillo</option>
                      <option value="radar" className="bg-gray-900 text-white">Radar</option>
                      <option value="area" className="bg-gray-900 text-white">Área</option>
                    </select>
                  </div>
                </div>

                <div className="pl-4 border-l-2 border-[var(--border-subtle)] space-y-2 pt-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)] ml-1 block">Opciones</label>
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                        placeholder={`Opción ${optIndex + 1}`}
                        className="flex-1 bg-white/5 border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-sm text-white focus:border-[var(--accent-primary)] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(qIndex, optIndex)}
                        disabled={q.options.length <= 2}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => handleAddOption(qIndex)}
                    className="text-[var(--accent-primary)] hover:text-white text-xs font-medium py-1 transition-colors flex items-center gap-1 mt-2"
                  >
                    <Plus size={12} /> Añadir opción a esta pregunta
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddQuestion}
              className="btn-outline w-full py-3 rounded-xl flex items-center justify-center gap-2 border-dashed text-[var(--text-secondary)] hover:text-white"
            >
              <Plus size={16} /> Añadir Nueva Pregunta
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
            {editingPollId ? 'Guardar Cambios' : 'Crear Encuesta'}
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
              const totalVotes = poll.poll_questions?.reduce((acc, q) => 
                acc + q.poll_options.reduce((sum, opt) => sum + (opt.poll_votes?.length || 0), 0)
              , 0) || 0;

              return (
                <div key={poll.id} className={`glass border rounded-2xl p-6 transition-all ${
                  poll.is_active ? 'border-[var(--accent-primary)] shadow-[0_0_20px_rgba(var(--accent-primary-rgb),0.15)]' : 'border-[var(--border-subtle)]'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-white font-bold leading-tight pr-4">{poll.name}</h4>
                    <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-white/5 text-[var(--text-muted)] flex items-center gap-1 shrink-0">
                      <BarChart2 size={12} /> {totalVotes}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <p className="text-xs text-[var(--text-secondary)]">{poll.poll_questions?.length || 0} Preguntas incluidas.</p>
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
                        onClick={() => downloadQR(poll.id, poll.name)}
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

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(poll)}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition-colors"
                        title="Editar Encuesta"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(poll.id)}
                        className="p-2 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Borrar Encuesta"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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

