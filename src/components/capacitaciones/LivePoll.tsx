'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

interface PollOption {
  id: string
  text: string
  votes_count: number
}

interface Poll {
  id: string
  question: string
  is_active: boolean
  options: PollOption[]
}

export function LivePoll({ trainingId }: { trainingId: string }) {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // 1. Cargar encuesta activa inicial
    fetchActivePoll()

    // 2. Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('live-polls')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'polls', filter: `training_id=eq.${trainingId}` },
        () => fetchActivePoll()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'poll_options' },
        (payload) => {
          setPoll(current => {
            if (!current) return null
            return {
              ...current,
              options: current.options.map(opt => 
                opt.id === payload.new.id ? { ...opt, votes_count: payload.new.votes_count } : opt
              )
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [trainingId])

  async function fetchActivePoll() {
    const { data: pollData } = await supabase
      .from('polls')
      .select('*, options:poll_options(*)')
      .eq('training_id', trainingId)
      .eq('is_active', true)
      .single()

    if (pollData) {
      setPoll(pollData)
    } else {
      setPoll(null)
      setHasVoted(false)
    }
  }

  async function handleVote(optionId: string) {
    if (hasVoted) return

    // Actualizar conteo en Supabase (Lógica simple para demo, idealmente vía RPC o Trigger)
    const option = poll?.options.find(o => o.id === optionId)
    if (option) {
      await supabase
        .from('poll_options')
        .update({ votes_count: (option.votes_count || 0) + 1 })
        .eq('id', optionId)
      
      setHasVoted(true)
    }
  }

  if (!poll) return null

  const totalVotes = poll.options.reduce((acc, opt) => acc + (opt.votes_count || 0), 0)

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="glass border border-[var(--accent-primary)]/20 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Encuesta en Vivo</span>
        </div>

        <h3 className="text-xl font-bold text-white mb-6 leading-tight">{poll.question}</h3>

        <div className="space-y-4">
          {poll.options.map((option) => {
            const percentage = totalVotes > 0 ? Math.round(((option.votes_count || 0) / totalVotes) * 100) : 0
            
            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={hasVoted}
                className="w-full relative group"
              >
                <div className="relative z-10 flex justify-between items-center p-4">
                  <span className={`text-sm font-medium ${hasVoted ? 'text-white' : 'text-[var(--text-secondary)] group-hover:text-white'}`}>
                    {option.text}
                  </span>
                  {hasVoted && (
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs font-bold font-mono"
                    >
                      {percentage}%
                    </motion.span>
                  )}
                </div>
                
                {/* Barra de progreso */}
                <div className="absolute inset-0 bg-white/5 rounded-xl overflow-hidden border border-white/5">
                  {hasVoted && (
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className="h-full bg-[var(--accent-primary)]/20"
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {hasVoted && (
          <p className="mt-4 text-center text-[10px] text-[var(--text-muted)] uppercase tracking-widest">
            {totalVotes} votos registrados
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
