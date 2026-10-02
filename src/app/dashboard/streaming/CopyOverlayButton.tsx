'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyOverlayButtonProps {
  path: string
}

export function CopyOverlayButton({ path }: CopyOverlayButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      const fullUrl = `${window.location.origin}${path}`
      navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`p-1.5 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer ${
        copied
          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
      }`}
    >
      {copied ? (
        <>
          <Check size={12} className="text-emerald-400" />
          <span>Copiado</span>
        </>
      ) : (
        <>
          <Copy size={12} />
          <span>Copiar URL</span>
        </>
      )}
    </button>
  )
}
