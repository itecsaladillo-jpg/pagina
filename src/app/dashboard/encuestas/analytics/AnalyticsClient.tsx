'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { ArrowLeft, BarChart2, PieChart as PieIcon, Activity, Layers } from 'lucide-react'
import Link from 'next/link'

interface PollOption {
  id: string
  text: string
  poll_votes: { id: string }[]
}

interface PollQuestion {
  id: string
  text: string
  poll_options: PollOption[]
}

interface Poll {
  id: string
  name: string
  created_at: string
  poll_questions: PollQuestion[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export function AnalyticsClient({ initialPolls }: { initialPolls: Poll[] }) {
  const [selectedPollIds, setSelectedPollIds] = useState<string[]>(initialPolls.length > 0 ? [initialPolls[0].id] : [])
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'radar'>('bar')

  const togglePoll = (id: string) => {
    setSelectedPollIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const selectedPolls = useMemo(() => {
    return initialPolls.filter(p => selectedPollIds.includes(p.id))
  }, [initialPolls, selectedPollIds])

  // Agrupar datos por nombre de opción para que si comparten las mismas opciones, se superpongan
  const chartData = useMemo(() => {
    const optionMap = new Map<string, any>()
    
    selectedPolls.forEach(poll => {
      poll.poll_questions?.forEach(q => {
        q.poll_options?.forEach(opt => {
          if (!optionMap.has(opt.text)) {
            optionMap.set(opt.text, { name: opt.text })
          }
          const dataObj = optionMap.get(opt.text)
          // Sumar votos si hay varias preguntas que coinciden en la misma encuesta
          dataObj[poll.id] = (dataObj[poll.id] || 0) + (opt.poll_votes?.length || 0)
        })
      })
    })
    
    return Array.from(optionMap.values())
  }, [selectedPolls])

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <Link href="/dashboard/encuestas" className="text-[var(--accent-primary)] hover:text-white flex items-center gap-2 mb-4 text-sm transition-colors">
            <ArrowLeft size={16} /> Volver a Encuestas
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Layers className="text-[var(--accent-primary-2)]" size={32} />
            Analíticas Avanzadas
          </h1>
          <p className="text-[var(--text-secondary)] text-sm max-w-2xl">
            Compara los resultados de múltiples encuestas superponiéndolos en un mismo gráfico. 
            Ideal para ver la evolución de las votaciones a lo largo del tiempo o medir el cambio de opinión.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Controls */}
        <div className="space-y-6">
          <div className="glass border border-[var(--border-subtle)] rounded-2xl p-5">
            <h3 className="text-sm uppercase font-bold tracking-widest text-[var(--text-secondary)] mb-4">
              Tipo de Gráfico
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setChartType('bar')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                  chartType === 'bar' ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/50' : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10 border border-transparent'
                }`}
              >
                <BarChart2 size={16} /> Barras
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                  chartType === 'line' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10 border border-transparent'
                }`}
              >
                <Activity size={16} /> Líneas
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                  chartType === 'area' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10 border border-transparent'
                }`}
              >
                <Layers size={16} /> Áreas
              </button>
              <button
                onClick={() => setChartType('radar')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                  chartType === 'radar' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10 border border-transparent'
                }`}
              >
                <PieIcon size={16} /> Radar
              </button>
            </div>
          </div>

          <div className="glass border border-[var(--border-subtle)] rounded-2xl p-5">
            <h3 className="text-sm uppercase font-bold tracking-widest text-[var(--text-secondary)] mb-4">
              Seleccionar Encuestas
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {initialPolls.map((poll, index) => {
                const isSelected = selectedPollIds.includes(poll.id)
                const color = COLORS[index % COLORS.length]
                const totalVotes = poll.poll_questions?.reduce((acc, q) => 
                  acc + q.poll_options.reduce((sum, opt) => sum + (opt.poll_votes?.length || 0), 0)
                , 0) || 0;
                
                return (
                  <button
                    key={poll.id}
                    onClick={() => togglePoll(poll.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected 
                        ? 'bg-white/10 border-white/20' 
                        : 'bg-white/5 border-transparent opacity-60 hover:opacity-100 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex-1 pr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className={`w-3 h-3 rounded-full transition-all ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} 
                          style={{ backgroundColor: color }}
                        />
                        <p className="text-sm font-semibold text-white line-clamp-1">{poll.name}</p>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] ml-5">{totalVotes} votos totales</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Chart View */}
        <div className="lg:col-span-3 glass border border-[var(--border-subtle)] rounded-3xl p-6 lg:p-10 min-h-[500px] flex flex-col">
          {selectedPolls.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Layers className="text-[var(--text-muted)]" size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Ninguna encuesta seleccionada</h2>
              <p className="text-[var(--text-secondary)]">Seleccioná una o más encuestas en el panel lateral para comparar sus resultados.</p>
            </div>
          ) : (
            <div className="flex-1 w-full h-[500px] relative">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} angle={-45} textAnchor="end" />
                    <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem', color: '#fff'}} itemStyle={{color: '#fff'}} />
                    <Legend wrapperStyle={{paddingTop: '20px'}} />
                    {selectedPolls.map((poll, index) => (
                      <Bar key={poll.id} dataKey={poll.id} name={poll.name} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                ) : chartType === 'line' ? (
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} angle={-45} textAnchor="end" />
                    <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                    <Tooltip contentStyle={{backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem', color: '#fff'}} />
                    <Legend wrapperStyle={{paddingTop: '20px'}} />
                    {selectedPolls.map((poll, index) => (
                      <Line key={poll.id} type="monotone" dataKey={poll.id} name={poll.name} stroke={COLORS[index % COLORS.length]} strokeWidth={3} dot={{r: 6, strokeWidth: 2}} activeDot={{r: 8}} />
                    ))}
                  </LineChart>
                ) : chartType === 'area' ? (
                  <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} angle={-45} textAnchor="end" />
                    <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                    <Tooltip contentStyle={{backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem', color: '#fff'}} />
                    <Legend wrapperStyle={{paddingTop: '20px'}} />
                    {selectedPolls.map((poll, index) => (
                      <Area key={poll.id} type="monotone" dataKey={poll.id} name={poll.name} stroke={COLORS[index % COLORS.length]} fill={COLORS[index % COLORS.length]} fillOpacity={0.3} strokeWidth={2} />
                    ))}
                  </AreaChart>
                ) : (
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="rgba(255,255,255,0.2)" />
                    <PolarAngleAxis dataKey="name" tick={{fill: 'rgba(255,255,255,0.8)', fontSize: 12}} />
                    <PolarRadiusAxis angle={30} domain={['auto', 'auto']} tick={{fill: 'rgba(255,255,255,0.5)'}} />
                    <Tooltip contentStyle={{backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem', color: '#fff'}} />
                    <Legend wrapperStyle={{paddingTop: '20px'}} />
                    {selectedPolls.map((poll, index) => (
                      <Radar key={poll.id} name={poll.name} dataKey={poll.id} stroke={COLORS[index % COLORS.length]} fill={COLORS[index % COLORS.length]} fillOpacity={0.4} />
                    ))}
                  </RadarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
