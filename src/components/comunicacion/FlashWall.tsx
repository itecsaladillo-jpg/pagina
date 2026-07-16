'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { NewsFlash } from '@/services/news'

interface FlashWallProps {
  flashes: NewsFlash[]
}

export function FlashWall({ flashes }: FlashWallProps) {
  if (flashes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='glass border border-white/5 rounded-3xl p-12 text-center'
      >
        <p className='text-white/40 text-sm'>
          No hay noticias disponibles.
        </p>
      </motion.div>
    )
  }

  return (
    <div className='glass border border-white/5 rounded-3xl overflow-hidden'>
      <div className='p-8 border-b border-white/5 bg-white/[0.02]'>
        <h2 className='text-xl font-bold text-white flex items-center gap-3'>
          Últimas Novedades
        </h2>
      </div>
      <div className='p-8 space-y-6'>
        <AnimatePresence>
          {flashes.map((flash) => (
            <motion.article
              key={flash.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='border-b border-white/5 pb-6 last:border-0 last:pb-0'
            >
              <h3 className='text-lg font-bold text-white mb-3'>{flash.titulo}</h3>
              <p className='text-sm text-white/80 leading-relaxed whitespace-pre-wrap'>
                {flash.flash_text || flash.texto_publico}
              </p>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}