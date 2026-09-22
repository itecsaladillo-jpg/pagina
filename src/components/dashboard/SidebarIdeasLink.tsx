'use client'

import { Lightbulb } from 'lucide-react'
import Link from 'next/link'

interface Props {
  hasPendingIdeas: boolean
  pendingCount: number
}

export function SidebarIdeasLink({ hasPendingIdeas, pendingCount }: Props) {
  return (
    <Link
      href="/dashboard/ideas"
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-all text-sm font-medium group"
    >
      {hasPendingIdeas ? (
        <div className="animate-pulse-glow-light">
          <Lightbulb className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
        </div>
      ) : (
        <Lightbulb className="w-4 h-4 group-hover:text-[var(--accent-primary-2)] transition-colors" />
      )}
      <span className="flex-1">Buzón de Ideas</span>
      {hasPendingIdeas && (
        <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
          {pendingCount}
        </span>
      )}
    </Link>
  )
}
