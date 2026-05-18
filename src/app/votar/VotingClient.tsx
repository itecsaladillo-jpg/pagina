'use client'

import { useState, useEffect } from 'react'
import { submitVoteAction } from '@/app/dashboard/encuestas/actions'
import { Loader2, CheckCircle2, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

interface Option {
  id: string
  text: string
}

interface Question {
  id: string
  text: string
  poll_options: Option[]
}

interface Poll {
  id: string
  name: string
  poll_questions: Question[]
}

export function VotingClient({ poll }: { poll: Poll | null }) {
  const [hasVoted, setHasVoted] = useState(false)
  const [justVoted, setJustVoted] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [showIntermediate, setShowIntermediate] = useState(false)

  useEffect(() => {
    if (poll) {
      const voted = localStorage.getItem(`voted_${poll.id}`)
      if (voted) setHasVoted(true)
    }
  }, [poll])

  if (!poll) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#17338c]/20 via-gray-950 to-gray-950 pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-[2rem] p-10 text-center shadow-2xl animate-fade-in">
          <Image src="/logoitectrans_v2.png" alt="ITEC" width={180} height={60} className="mx-auto mb-10 opacity-70 drop-shadow-md" priority />
          
          <div className="w-20 h-20 rounded-full bg-[#17338c]/10 flex items-center justify-center mx-auto mb-8 border border-[#17338c]/30 relative">
            <div className="absolute inset-0 rounded-full border border-[var(--accent-primary)] animate-ping opacity-20" />
            <Loader2 size={36} className="text-[var(--accent-primary)] animate-spin" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-3">Esperando encuesta...</h1>
          <p className="text-gray-400 text-sm max-w-[260px] mx-auto leading-relaxed">
            La votación comenzará automáticamente cuando el presentador la lance en pantalla.
          </p>
        </div>
      </div>
    )
  }

  const currentQuestion = poll.poll_questions?.[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === (poll.poll_questions?.length || 0) - 1

  const handleVoteClick = async (optionId: string) => {
    if (isVoting) return

    const newSelections = { ...selections, [currentQuestion.id]: optionId }
    setSelections(newSelections)

    if (!isLastQuestion) {
      // Mostrar pantalla intermedia
      setShowIntermediate(true)
      setTimeout(() => {
        setShowIntermediate(false)
        setCurrentQuestionIndex(prev => prev + 1)
      }, 1500) // 1.5 segundos de mensaje "Voto computado"
    } else {
      // Última pregunta: enviar a la base de datos
      setIsVoting(true)
      const selectedOptions = Object.values(newSelections)
      
      const res = await submitVoteAction(selectedOptions, poll.id)
      if (res.success || res.error === 'Ya has votado en esta encuesta con este dispositivo.') {
        localStorage.setItem(`voted_${poll.id}`, 'true')
        setHasVoted(true)
        if (res.success) {
          setJustVoted(true)
        }
      } else {
        alert(res.error || 'Error al registrar el voto')
      }
      setIsVoting(false)
    }
  }

  if (hasVoted) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/10 via-gray-950 to-gray-950 pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-[2rem] p-10 text-center shadow-2xl animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-8 border border-green-500/30 relative">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-pulse" />
            <CheckCircle2 size={48} className="text-green-400 relative z-10" />
          </div>
          
          {justVoted ? (
            <>
              <h1 className="text-3xl font-bold text-white mb-4">¡Encuesta Completada!</h1>
              <p className="text-gray-400 text-base mb-12 max-w-[280px] mx-auto leading-relaxed">
                Tus respuestas han sido registradas con éxito. Mirá la pantalla principal para ver los resultados en vivo.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white mb-4 leading-snug uppercase">
                YA VOTASTE EN ESTA ENCUESTA
              </h1>
              <p className="text-gray-400 text-lg mb-12 max-w-[280px] mx-auto font-medium uppercase tracking-wide">
                GRACIAS POR PARTICIPAR
              </p>
            </>
          )}
          
          <Image src="/logoitectrans_v2.png" alt="ITEC" width={140} height={45} className="mx-auto opacity-40 grayscale" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#17338c]/20 via-gray-950 to-gray-950 pointer-events-none fixed" />

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col h-full pt-8 pb-10">
        <div className="text-center mb-6">
          <Image src="/logoitectrans_v2.png" alt="ITEC" width={140} height={45} className="mx-auto mb-8 opacity-90 drop-shadow-xl" priority />
          
          <div className="flex items-center justify-between px-2 mb-4">
            <span className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-widest">
              Pregunta {currentQuestionIndex + 1} de {poll.poll_questions?.length}
            </span>
            <div className="flex gap-1">
              {poll.poll_questions?.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === currentQuestionIndex ? 'w-6 bg-[var(--accent-primary)]' : 
                    i < currentQuestionIndex ? 'w-2 bg-[var(--accent-primary)]/50' : 'w-2 bg-gray-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 relative flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {showIntermediate ? (
              <motion.div
                key="intermediate"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center text-center py-12"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                  <CheckCircle2 size={32} className="text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Voto computado</h2>
                <p className="text-gray-400">Preparando siguiente pregunta...</p>
              </motion.div>
            ) : isVoting ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center text-center py-12"
              >
                <Loader2 size={48} className="text-[var(--accent-primary)] animate-spin mb-6" />
                <h2 className="text-xl font-bold text-white">Enviando respuestas...</h2>
              </motion.div>
            ) : (
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-3xl p-6 shadow-2xl shadow-black/50 mb-8">
                  <h1 className="text-2xl md:text-3xl font-bold text-white leading-snug">
                    {currentQuestion.text}
                  </h1>
                </div>

                <div className="space-y-4">
                  {currentQuestion.poll_options.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleVoteClick(opt.id)}
                      className="w-full relative group overflow-hidden rounded-[1.25rem] p-[2px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#17338c]/80 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                      
                      <div className="relative bg-gray-900 backdrop-blur-xl border border-gray-800/80 rounded-[1.2rem] py-5 px-6 flex items-center justify-between z-10 transition-colors shadow-lg group-hover:bg-gray-800/80">
                        <span className="text-white font-medium text-lg md:text-xl text-left pr-4">
                          {opt.text}
                        </span>
                        <ChevronRight className="text-gray-600 group-hover:text-[var(--accent-primary)] transition-colors" size={24} />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
