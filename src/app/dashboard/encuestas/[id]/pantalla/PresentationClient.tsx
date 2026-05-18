'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import QRCode from 'react-qr-code'

interface Option {
  id: string
  text: string
}

interface Poll {
  id: string
  question: string
  is_active: boolean
  poll_options: Option[]
  poll_votes: { id: string, option_id: string }[]
}

export function PresentationClient({ initialPoll }: { initialPoll: Poll }) {
  const [votes, setVotes] = useState(initialPoll.poll_votes)
  const [votingUrl, setVotingUrl] = useState('')

  useEffect(() => {
    setVotingUrl(`${window.location.origin}/votar`)
    
    const supabase = createClient()

    const channel = supabase.channel(`poll_votes_${initialPoll.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'poll_votes'
      }, (payload) => {
        // Only count if it belongs to one of this poll's options
        if (initialPoll.poll_options.some(opt => opt.id === payload.new.option_id)) {
          setVotes(prev => [...prev, payload.new as any])
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [initialPoll])

  const totalVotes = votes.length

  // Calculate percentages
  const results = initialPoll.poll_options.map(opt => {
    const optionVotes = votes.filter(v => v.option_id === opt.id).length
    const percentage = totalVotes === 0 ? 0 : Math.round((optionVotes / totalVotes) * 100)
    return { ...opt, votes: optionVotes, percentage }
  }).sort((a, b) => b.votes - a.votes) // Ordenar de mayor a menor

  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-black flex flex-col p-8 overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--accent-primary)]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between z-10 mb-16">
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col z-10 max-w-6xl w-full mx-auto justify-center">
        <div className="mb-16 text-center">
          {initialPoll.is_active ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/20 text-red-400 font-bold text-sm tracking-widest uppercase mb-6 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              Encuesta en Vivo
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-[var(--text-muted)] font-bold text-sm tracking-widest uppercase mb-6">
              Votación Cerrada
            </div>
          )}
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
            {initialPoll.question}
          </h1>
        </div>

        {/* Results Bars */}
        <div className="space-y-8 mt-8">
          <AnimatePresence>
            {results.map((result, index) => (
              <motion.div 
                key={result.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="relative"
              >
                <div className="flex justify-between items-end mb-3 px-1">
                  <h3 className="text-2xl md:text-3xl font-bold text-white truncate pr-4">
                    {result.text}
                  </h3>
                  <div className="text-right shrink-0">
                    <span className="text-4xl md:text-5xl font-black text-white tabular-nums">
                      {result.percentage}%
                    </span>
                    <span className="text-[var(--text-muted)] text-sm ml-3 font-medium">
                      ({result.votes} votos)
                    </span>
                  </div>
                </div>

                <div className="h-10 md:h-12 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(result.percentage, 1)}%` }} // Al menos 1% para que se vea la barrita si hay 0%
                    transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                    className={`h-full rounded-full ${index === 0 ? 'bg-gradient-to-r from-[var(--accent-primary)] to-blue-500 shadow-[0_0_20px_rgba(var(--accent-primary-rgb),0.5)]' : 'bg-white/20'}`}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 text-center z-10">
        <p className="text-[var(--text-secondary)] text-xl font-medium tracking-wide">
          Total de votos registrados: <span className="text-white font-bold tabular-nums">{totalVotes}</span>
        </p>
      </footer>
    </div>
  )
}
