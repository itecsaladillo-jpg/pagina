'use client'

import { useState, useEffect } from 'react'
import { submitVoteAction } from '@/app/dashboard/encuestas/actions'
import { Loader2, CheckCircle2, ArrowRight, Send } from 'lucide-react'
import Image from 'next/image'

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
  
  // Guardamos las selecciones como { [questionId]: optionId }
  const [selections, setSelections] = useState<Record<string, string>>({})
  // Controlamos en qué pregunta estamos si queremos hacerlo paso a paso, 
  // pero para encuestas rápidas, mostrarlas todas en una lista vertical es mejor.

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

  const handleSelect = (questionId: string, optionId: string) => {
    setSelections(prev => ({
      ...prev,
      [questionId]: optionId
    }))
  }

  const handleSubmit = async () => {
    const selectedOptions = Object.values(selections)
    if (selectedOptions.length !== poll.poll_questions.length) {
      alert('Por favor responde a todas las preguntas antes de enviar.')
      return
    }

    setIsVoting(true)
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
              <h1 className="text-3xl font-bold text-white mb-4">¡Voto Registrado!</h1>
              <p className="text-gray-400 text-base mb-12 max-w-[280px] mx-auto leading-relaxed">
                Tu voto ha sido contabilizado con éxito. Mirá la pantalla principal para ver los resultados en vivo.
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

  const isComplete = Object.keys(selections).length === poll.poll_questions?.length

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#17338c]/20 via-gray-950 to-gray-950 pointer-events-none fixed" />

      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col h-full pt-8 pb-20 animate-fade-in">
        <div className="text-center mb-8">
          <Image src="/logoitectrans_v2.png" alt="ITEC" width={140} height={45} className="mx-auto mb-8 opacity-90 drop-shadow-xl" />
          
          <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-3xl p-6 shadow-2xl shadow-black/50 mb-8">
            <h1 className="text-2xl font-bold text-white leading-snug uppercase tracking-wide">
              {poll.name}
            </h1>
            <p className="text-gray-400 text-sm mt-2 font-medium">Por favor respondé todas las preguntas</p>
          </div>
        </div>

        <div className="space-y-12 flex-1">
          {poll.poll_questions?.map((q, index) => (
            <div key={q.id} className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4 flex gap-3 items-start">
                <span className="flex items-center justify-center bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] w-8 h-8 rounded-full text-sm font-black shrink-0">
                  {index + 1}
                </span>
                <span className="mt-0.5">{q.text}</span>
              </h2>

              <div className="space-y-3">
                {q.poll_options.map(opt => {
                  const isSelected = selections[q.id] === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelect(q.id, opt.id)}
                      disabled={isVoting}
                      className={`w-full relative group overflow-hidden rounded-[1.25rem] p-[2px] transition-all duration-300 ${
                        isSelected ? 'scale-[1.02]' : 'hover:scale-[1.02] active:scale-[0.98]'
                      } ${isVoting ? 'opacity-50 grayscale' : ''}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#17338c]/80 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                      
                      <div className={`relative bg-gray-900 backdrop-blur-xl border ${
                        isSelected ? 'border-[var(--accent-primary)] bg-[#17338c]/20' : 'border-gray-800/80'
                      } rounded-[1.2rem] py-4 px-5 flex items-center justify-between z-10 transition-colors shadow-lg`}>
                        <span className="text-white font-medium text-lg text-left pr-4">
                          {opt.text}
                        </span>
                        
                        <div className={`w-5 h-5 rounded-full border-2 transition-colors shrink-0 flex items-center justify-center ${
                          isSelected ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]' : 'border-gray-600 group-hover:border-[#17338c]'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent z-20 pointer-events-none">
          <div className="max-w-lg mx-auto pointer-events-auto">
            <button
              onClick={handleSubmit}
              disabled={!isComplete || isVoting}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg shadow-xl transition-all ${
                isComplete && !isVoting
                  ? 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/80 text-white translate-y-0 opacity-100'
                  : 'bg-gray-800 text-gray-500 translate-y-2 opacity-50 cursor-not-allowed'
              }`}
            >
              {isVoting ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  Enviando...
                </>
              ) : (
                <>
                  <Send size={24} />
                  Enviar Respuestas
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
