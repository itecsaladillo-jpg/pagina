'use client'

import { useState, useEffect } from 'react'
import { submitVoteAction } from '@/app/dashboard/encuestas/actions'
import { Loader2, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

interface Option {
  id: string
  text: string
}

interface Poll {
  id: string
  question: string
  poll_options: Option[]
}

export function VotingClient({ poll }: { poll: Poll | null }) {
  const [hasVoted, setHasVoted] = useState(false)
  const [votingId, setVotingId] = useState<string | null>(null)

  useEffect(() => {
    if (poll) {
      const voted = localStorage.getItem(`voted_${poll.id}`)
      if (voted) setHasVoted(true)
    }
  }, [poll])

  if (!poll) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6">
        <Image src="/logoitectrans_v2.png" alt="ITEC" width={180} height={60} className="mb-12 opacity-50" />
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <Loader2 size={32} className="text-[var(--text-muted)] animate-spin" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2 text-center">Esperando encuesta...</h1>
        <p className="text-[var(--text-secondary)] text-center max-w-xs">
          La votación comenzará automáticamente cuando el presentador la lance en pantalla.
        </p>
      </div>
    )
  }

  const handleVote = async (optionId: string) => {
    setVotingId(optionId)
    const res = await submitVoteAction(optionId)
    if (res.success) {
      localStorage.setItem(`voted_${poll.id}`, 'true')
      setHasVoted(true)
    }
    setVotingId(null)
  }

  if (hasVoted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6 animate-fade-in text-center">
        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-8 mx-auto">
          <CheckCircle2 size={48} className="text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">¡Voto Registrado!</h1>
        <p className="text-[var(--text-secondary)] text-lg mb-12">
          Gracias por participar. Mirá la pantalla principal para ver los resultados en vivo.
        </p>
        <Image src="/logoitectrans_v2.png" alt="ITEC" width={140} height={45} className="mx-auto opacity-50" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-6 flex flex-col pt-12 animate-fade-in">
      <div className="text-center mb-10">
        <Image src="/logoitectrans_v2.png" alt="ITEC" width={120} height={40} className="mx-auto mb-6 opacity-80" />
        <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
          {poll.question}
        </h1>
      </div>

      <div className="space-y-4 max-w-md w-full mx-auto flex-1">
        {poll.poll_options.map(opt => (
          <button
            key={opt.id}
            onClick={() => handleVote(opt.id)}
            disabled={votingId !== null}
            className="w-full py-5 px-6 bg-white/10 hover:bg-[var(--accent-primary)]/80 border border-white/20 hover:border-[var(--accent-primary)] rounded-2xl text-left text-white font-bold text-xl transition-all shadow-lg shadow-black/50 active:scale-[0.98] disabled:opacity-50 flex items-center justify-between"
          >
            {opt.text}
            {votingId === opt.id && <Loader2 className="animate-spin" size={24} />}
          </button>
        ))}
      </div>
    </div>
  )
}
