'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import QRCode from 'react-qr-code'
import { ChevronLeft, ChevronRight, Layers, BarChart2 as BarChartIcon } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Option {
  id: string
  text: string
}

interface Question {
  id: string
  text: string
  poll_options: Option[]
  poll_votes: { id: string, option_id: string }[]
}

interface Poll {
  id: string
  name: string
  is_active: boolean
  poll_questions: Question[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

export function PresentationClient({ initialPoll }: { initialPoll: Poll }) {
  // Combinar todos los votos de todas las opciones de todas las preguntas
  const allInitialVotes = initialPoll.poll_questions.flatMap(q => 
    q.poll_options.flatMap(opt => 
      (opt as any).poll_votes?.map((v: any) => ({ ...v, question_id: q.id })) || []
    )
  )

  const [votes, setVotes] = useState(allInitialVotes)
  const [votingUrl, setVotingUrl] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [overlayMode, setOverlayMode] = useState(false)

  useEffect(() => {
    setVotingUrl(`${window.location.origin}/votar`)
    
    const supabase = createClient()

    const channel = supabase.channel(`poll_votes_${initialPoll.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'poll_votes'
      }, (payload) => {
        // Encontrar a qué pregunta pertenece la opción
        let questionId = null
        for (const q of initialPoll.poll_questions) {
          if (q.poll_options.some(opt => opt.id === payload.new.option_id)) {
            questionId = q.id
            break
          }
        }

        if (questionId) {
          setVotes(prev => [...prev, { ...payload.new as any, question_id: questionId }])
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [initialPoll])

  const totalVotes = votes.length

  const currentQuestion = initialPoll.poll_questions[currentQuestionIndex]

  // Resultados para la vista individual
  const results = currentQuestion?.poll_options.map(opt => {
    const optionVotes = votes.filter(v => v.option_id === opt.id).length
    const qTotalVotes = votes.filter(v => v.question_id === currentQuestion.id).length
    const percentage = qTotalVotes === 0 ? 0 : Math.round((optionVotes / qTotalVotes) * 100)
    return { ...opt, votes: optionVotes, percentage }
  }).sort((a, b) => b.votes - a.votes) || []

  // Datos para la vista superpuesta (Overlay)
  const overlayData = useMemo(() => {
    const optionMap = new Map<string, any>()
    
    initialPoll.poll_questions.forEach(q => {
      q.poll_options.forEach(opt => {
        if (!optionMap.has(opt.text)) {
          optionMap.set(opt.text, { name: opt.text })
        }
        const dataObj = optionMap.get(opt.text)
        dataObj[q.id] = votes.filter(v => v.option_id === opt.id).length
      })
    })
    
    return Array.from(optionMap.values())
  }, [initialPoll, votes])

  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-black flex flex-col p-8 overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--accent-primary)]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between z-10 mb-8">
        <Image src="/logoitectrans_v2.png" alt="ITEC" width={200} height={60} className="opacity-90" />
        
        <div className="flex items-center gap-6 glass px-6 py-3 rounded-2xl border border-white/10">
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">Para votar ingresá a:</p>
            <p className="text-xl font-bold text-white">{votingUrl}</p>
          </div>
          <div className="w-12 h-12 bg-white rounded-xl p-1.5 flex items-center justify-center shrink-0">
            {votingUrl && (
              <QRCode
                value={votingUrl}
                size={48}
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                viewBox={`0 0 48 48`}
              />
            )}
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="flex items-center justify-between z-20 mb-8 max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 border border-white/10">
          <button 
            onClick={() => setOverlayMode(false)}
            className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${!overlayMode ? 'bg-[var(--accent-primary)] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <BarChartIcon size={16} /> Individual
          </button>
          <button 
            onClick={() => setOverlayMode(true)}
            className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${overlayMode ? 'bg-[var(--accent-primary)] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Layers size={16} /> Superposición (Todas)
          </button>
        </div>

        {!overlayMode && initialPoll.poll_questions.length > 1 && (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="text-white font-bold tabular-nums">
              {currentQuestionIndex + 1} / {initialPoll.poll_questions.length}
            </span>
            <button 
              onClick={() => setCurrentQuestionIndex(prev => Math.min(initialPoll.poll_questions.length - 1, prev + 1))}
              disabled={currentQuestionIndex === initialPoll.poll_questions.length - 1}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/20 transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col z-10 max-w-6xl w-full mx-auto justify-center relative">
        <div className="mb-12 text-center">
          {initialPoll.is_active ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/20 text-red-400 font-bold text-sm tracking-widest uppercase mb-4 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              Encuesta en Vivo
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-[var(--text-muted)] font-bold text-sm tracking-widest uppercase mb-4">
              Votación Cerrada
            </div>
          )}
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
            {overlayMode ? initialPoll.name : currentQuestion?.text}
          </h1>
        </div>

        {overlayMode ? (
          <div className="flex-1 w-full min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overlayData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.8)', fontSize: 16}} />
                <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem', color: '#fff'}} />
                <Legend wrapperStyle={{paddingTop: '20px'}} />
                {initialPoll.poll_questions.map((q, index) => (
                  <Bar key={q.id} dataKey={q.id} name={q.text} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {results.map((result, index) => (
                  <div key={result.id} className="relative">
                    <div className="flex justify-between items-end mb-2 px-1">
                      <h3 className="text-2xl font-bold text-white truncate pr-4">
                        {result.text}
                      </h3>
                      <div className="text-right shrink-0">
                        <span className="text-3xl font-black text-white tabular-nums">
                          {result.percentage}%
                        </span>
                        <span className="text-[var(--text-muted)] text-sm ml-2 font-medium">
                          ({result.votes} votos)
                        </span>
                      </div>
                    </div>

                    <div className="h-8 md:h-10 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-1">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(result.percentage, 1)}%` }}
                        transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                        className={`h-full rounded-full ${index === 0 ? 'bg-gradient-to-r from-[var(--accent-primary)] to-blue-500 shadow-[0_0_20px_rgba(var(--accent-primary-rgb),0.5)]' : 'bg-white/20'}`}
                      />
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-8 text-center z-10">
        <p className="text-[var(--text-secondary)] text-xl font-medium tracking-wide">
          Total de votos registrados (todas las preguntas): <span className="text-white font-bold tabular-nums">{totalVotes}</span>
        </p>
      </footer>
    </div>
  )
}
