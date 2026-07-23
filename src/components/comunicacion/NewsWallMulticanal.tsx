'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Users, Building2, Newspaper, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { NewsFlashMulticanal } from '@/services/news-multicanal'

interface NewsWallMulticanalProps {
  publicFlashes: NewsFlashMulticanal[]
  memberFlashes: NewsFlashMulticanal[] | null
  sponsorFlashes?: NewsFlashMulticanal[] | null
  pressFlashes?: NewsFlashMulticanal[] | null
  defaultTab?: 'publico' | 'interno' | 'sponsors' | 'prensa'
  hideTabs?: boolean
}

function MediaSlideshow({ mediaUrls }: { mediaUrls: string[] }) {
  const [current, setCurrent] = useState(0)
  const stripQuery = (u: string) => u.split('?')[0]
  const isVideoUrl = (u: string) => /\.(mp4|webm|mov)/i.test(stripQuery(u))
  // Tratar como imagen todo lo que no sea video (incluye URLs sin extensión de Supabase Storage)
  const videos = mediaUrls.filter(u => isVideoUrl(u))
  const images = mediaUrls.filter(u => !isVideoUrl(u))

  if (images.length === 0 && videos.length === 0) return null

  const allMedia = [...images, ...videos]

  const prev = useCallback(() => setCurrent(c => (c === 0 ? allMedia.length - 1 : c - 1)), [allMedia.length])
  const next = useCallback(() => setCurrent(c => (c === allMedia.length - 1 ? 0 : c + 1)), [allMedia.length])

  // Slide automático cada 5 segundos si hay más de 1 imagen/video
  useEffect(() => {
    if (allMedia.length <= 1) return
    const timer = setInterval(() => {
      next()
    }, 5000)
    return () => clearInterval(timer)
  }, [allMedia.length, next])

  const isVideo = current >= images.length

  return (
    <div className="relative group rounded-xl overflow-hidden bg-black/20">
      <div className="aspect-video max-h-[125px] flex items-center justify-center">
        {isVideo ? (
          <video src={videos[current - images.length]} controls className="w-full h-full object-contain" />
        ) : (
          <img src={images[current]} alt="" className="w-full h-full object-contain transition-opacity duration-500" />
        )}
      </div>
      {allMedia.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70 z-10">
            <ChevronLeft size={18} />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70 z-10">
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {allMedia.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-white w-3' : 'bg-white/40'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function NewsWallMulticanal({ 
  publicFlashes, 
  memberFlashes,
  sponsorFlashes,
  pressFlashes,
  defaultTab = 'publico',
  hideTabs = false
}: NewsWallMulticanalProps) {
  const [activeTab, setActiveTab] = useState<'publico' | 'interno' | 'sponsors' | 'prensa'>(defaultTab)

  const hasInternalAccess = memberFlashes !== null && memberFlashes.length > 0
  const hasSponsorAccess = (sponsorFlashes?.length ?? 0) > 0
  const hasPressAccess = (pressFlashes?.length ?? 0) > 0

  const currentFlashes = activeTab === 'publico' 
    ? publicFlashes 
    : activeTab === 'interno' 
      ? (memberFlashes || [])
      : activeTab === 'sponsors'
        ? (sponsorFlashes || [])
        : (pressFlashes || [])

  const getFlashText = (flash: NewsFlashMulticanal) => {
    switch (activeTab) {
      case 'publico': return flash.texto_publico
      case 'interno': return flash.texto_miembros
      case 'sponsors': return flash.texto_sponsors
      case 'prensa': return flash.texto_medios
      default: return flash.texto_publico
    }
  }

  const getMediaUrls = (flash: NewsFlashMulticanal): string[] => {
    const m = (flash as any).media_urls
    if (Array.isArray(m)) return m
    if (typeof m === 'string') {
      try {
        const parsed = JSON.parse(m)
        if (Array.isArray(parsed)) return parsed
      } catch {}
    }
    return []
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'd MMMM, yyyy', { locale: es })
  }

  const getEmptyMessage = () => {
    if (activeTab === 'publico') return 'No hay noticias publicas disponibles.'
    if (activeTab === 'interno') return 'No hay noticias para miembros.'
    if (activeTab === 'sponsors') return 'No hay noticias para sponsors.'
    return 'No hay noticias para medios.'
  }

  return (
    <div className='space-y-2'>
      {!hideTabs && (
        <div className='flex items-center gap-1 bg-white/[0.02] border border-white/5 rounded-xl p-1.5 w-fit flex-wrap'>
        <button
          onClick={() => setActiveTab('publico')}
          className='flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all bg-blue-600/20 text-blue-400 border border-blue-500/30'
        >
          <Globe size={12} />
          Público
        </button>
        {hasInternalAccess && (
          <button
            onClick={() => setActiveTab('interno')}
            className='flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
          >
            <Users size={12} />
            Muro Noticias
          </button>
        )}
        {hasSponsorAccess && (
          <button
            onClick={() => setActiveTab('sponsors')}
            className='flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all bg-amber-600/20 text-amber-400 border border-amber-500/30'
          >
            <Building2 size={12} />
            Muro Sponsors
          </button>
        )}
        {hasPressAccess && (
          <button
            onClick={() => setActiveTab('prensa')}
            className='flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all bg-purple-600/20 text-purple-400 border border-purple-500/30'
          >
            <Newspaper size={12} />
            Prensa
          </button>
        )}
      </div>
      )}

      <AnimatePresence>
        {currentFlashes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='glass border border-white/5 rounded-2xl p-8 text-center'
          >
            <p className='text-white/40 text-sm'>
              {getEmptyMessage()}
            </p>
          </motion.div>
        ) : (
          <motion.div layout className='space-y-2'>
            {currentFlashes.map((flash) => {
              const mediaUrls = getMediaUrls(flash)
              return (
                <motion.article
                  key={flash.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='glass border border-white/5 rounded-xl p-3'
                >
                  {activeTab === 'interno' || activeTab === 'sponsors' ? (
                    <div className='overflow-hidden'>
                      <h2 className='text-base font-bold text-white mb-0.5'>{flash.titulo}</h2>
                      <span className='text-[10px] text-white/40 block mb-1'>
                        {formatDate(flash.created_at)}
                      </span>
                      {mediaUrls.length > 0 && (
                        <div className='float-right ml-4 mb-2 w-1/2 md:w-1/3'>
                          <MediaSlideshow mediaUrls={mediaUrls} />
                        </div>
                      )}
                      <p className='text-white/80 leading-snug whitespace-pre-wrap text-sm'>
                        {getFlashText(flash)}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className='flex items-start justify-between mb-4'>
                        <div className='flex-1'>
                          <h2 className='text-base font-bold text-white mb-0.5'>{flash.titulo}</h2>
                          <span className='text-[10px] text-white/40'>
                            {formatDate(flash.created_at)}
                          </span>
                        </div>
                      </div>
                      {mediaUrls.length > 0 && activeTab !== 'prensa' && (
                        <MediaSlideshow mediaUrls={mediaUrls} />
                      )}
                      <p className='text-white/80 leading-snug whitespace-pre-wrap mb-2 text-sm'>
                        {getFlashText(flash)}
                      </p>
                    </>
                  )}

                  {activeTab === 'prensa' && mediaUrls.length > 0 && (
                    <div className='flex flex-wrap gap-3 mb-4'>
                      {mediaUrls.map((url, i) => {
                        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)/i.test(url.split('?')[0])
                        return isImage ? (
                          <div key={i} className='group relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 bg-black/30'>
                            <img src={url} alt={`Imagen ${i + 1}`} className='w-full h-full object-cover' />
                            <button
                              onClick={() => {
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `imagen_${i + 1}`
                                document.body.appendChild(a)
                                a.click()
                                document.body.removeChild(a)
                              }}
                              className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'
                            >
                              <Download size={16} className='text-white' />
                            </button>
                          </div>
                        ) : (
                          <button
                            key={i}
                            onClick={() => {
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `archivo_${i + 1}`
                              document.body.appendChild(a)
                              a.click()
                              document.body.removeChild(a)
                            }}
                            className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-white/60 text-xs hover:text-white hover:border-white/30 transition-all cursor-pointer'
                          >
                            <Download size={12} />
                            {url.match(/\.(\w+)$/)?.[1]?.toUpperCase() || 'ARCHIVO'} {i + 1}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </motion.article>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
