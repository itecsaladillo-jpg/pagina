'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, Loader2, Globe, Users, ChevronDown, Building2, Newspaper, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { NewsFlashMulticanal } from '@/services/news-multicanal'

type Comment = { id: string; created_at: string; member_name: string; content: string }

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
    <div className="relative group rounded-xl overflow-hidden bg-black/20 mb-4">
      <div className="aspect-video max-h-[250px] flex items-center justify-center">
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
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({})
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [flashesWithComments, setFlashesWithComments] = useState<Record<string, Comment[]>>({})

  const hasInternalAccess = memberFlashes !== null && memberFlashes.length > 0
  const hasSponsorAccess = (sponsorFlashes?.length ?? 0) > 0
  const hasPressAccess = (pressFlashes?.length ?? 0) > 0

  const handleSubmitComment = async (flashId: string) => {
    const content = commentInputs[flashId]?.trim()
    if (!content) return

    const res = await fetch('/api/news-comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ news_flash_id: flashId, content })
    })
    const data = await res.json()
    
    if (data.comment) {
      setFlashesWithComments(prev => ({
        ...prev,
        [flashId]: [...(prev[flashId] || []), data.comment]
      }))
      setCommentInputs(prev => ({ ...prev, [flashId]: '' }))
    }
  }

  const loadComments = async (flashId: string) => {
    const res = await fetch('/api/news-comments?news_flash_id=' + flashId)
    const data: { comments: Comment[] } = await res.json()
    setFlashesWithComments(prev => ({ ...prev, [flashId]: data.comments || [] }))
  }

  const loadCommentsOld = async (flashId: string) => {}
    

  const handleToggleComments = async (flashId: string) => {
    setExpandedComments(prev => ({ ...prev, [flashId]: !prev[flashId] }))
    if (!flashesWithComments[flashId] && !loadingComments[flashId]) {
      setLoadingComments(prev => ({ ...prev, [flashId]: true }))
      await loadComments(flashId)
      setLoadingComments(prev => ({ ...prev, [flashId]: false }))
    }
  }

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
    <div className='space-y-6'>
      {!hideTabs && (
        <div className='flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-2xl p-2 w-fit flex-wrap'>
        <button
          onClick={() => setActiveTab('publico')}
          className='flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all bg-blue-600/20 text-blue-400 border border-blue-500/30'
        >
          <Globe size={14} />
          Público
        </button>
        {hasInternalAccess && (
          <button
            onClick={() => setActiveTab('interno')}
            className='flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
          >
            <Users size={14} />
            Muro Noticias
          </button>
        )}
        {hasSponsorAccess && (
          <button
            onClick={() => setActiveTab('sponsors')}
            className='flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all bg-amber-600/20 text-amber-400 border border-amber-500/30'
          >
            <Building2 size={14} />
            Muro Sponsors
          </button>
        )}
        {hasPressAccess && (
          <button
            onClick={() => setActiveTab('prensa')}
            className='flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all bg-purple-600/20 text-purple-400 border border-purple-500/30'
          >
            <Newspaper size={14} />
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
            className='glass border border-white/5 rounded-3xl p-12 text-center'
          >
            <p className='text-white/40 text-sm'>
              {getEmptyMessage()}
            </p>
          </motion.div>
        ) : (
          <motion.div layout className='space-y-4'>
            {currentFlashes.map((flash) => {
              const mediaUrls = getMediaUrls(flash)
              return (
                <motion.article
                  key={flash.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='glass border border-white/5 rounded-2xl p-4'
                >
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex-1'>
                      <h2 className='text-lg font-bold text-white mb-1'>{flash.titulo}</h2>
                      <span className='text-[10px] text-white/40'>
                        {formatDate(flash.created_at)}
                      </span>
                    </div>
                  </div>

                  {activeTab === 'interno' ? (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                      <div>
                        {mediaUrls.length > 0 && (
                          <MediaSlideshow mediaUrls={mediaUrls} />
                        )}
                      </div>
                      <div className='flex flex-col justify-center'>
                        <p className='text-white/80 leading-snug whitespace-pre-wrap text-sm'>
                          {getFlashText(flash)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {mediaUrls.length > 0 && activeTab !== 'prensa' && (
                        <MediaSlideshow mediaUrls={mediaUrls} />
                      )}
                      <p className='text-white/80 leading-snug whitespace-pre-wrap mb-4 text-sm'>
                        {getFlashText(flash)}
                      </p>
                    </>
                  )}

                  {activeTab === 'prensa' && mediaUrls.length > 0 && (
                    <div className='flex flex-wrap gap-2 mb-4'>
                      {mediaUrls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          download
                          target='_blank'
                          rel='noopener noreferrer'
                          className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-white/60 text-xs hover:text-white hover:border-white/30 transition-all'
                        >
                          <Download size={12} />
                          {url.match(/\.(\w+)$/)?.[1]?.toUpperCase() || 'ARCHIVO'} {i + 1}
                        </a>
                      ))}
                    </div>
                  )}


                  {activeTab === 'interno' && (
                    <div className='border-t border-white/5 pt-4 mt-4'>
                      <button
                        onClick={() => handleToggleComments(flash.id)}
                        className='flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors mb-4'
                      >
                        <MessageCircle size={14} />
                        {expandedComments[flash.id] ? 'Ocultar' : 'Ver'} Comentarios
                        <ChevronDown size={14} />
                      </button>

                      <AnimatePresence>
                        {expandedComments[flash.id] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className='space-y-4'
                          >
                            {loadingComments[flash.id] ? (
                              <div className='flex items-center justify-center py-4'>
                                <Loader2 size={16} className='animate-spin text-white/40' />
                              </div>
                            ) : (
                              <>
                                {flashesWithComments[flash.id]?.length > 0 && (
                                  <div className='space-y-3 max-h-60 overflow-y-auto'>
                                    {flashesWithComments[flash.id].map((comment) => (
                                      <div
                                        key={comment.id}
                                        className='bg-white/[0.02] border border-white/5 rounded-xl p-3'
                                      >
                                        <div className='flex items-baseline gap-2 mb-1'>
                                          <span className='text-xs font-bold text-emerald-400'>
                                            {comment.member_name}
                                          </span>
                                          <span className='text-[10px] text-white/40'>
                                            {formatDate(comment.created_at)}
                                          </span>
                                        </div>
                                        <p className='text-sm text-white/70'>
                                          {comment.content}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className='flex flex-col gap-2'>
                                  <textarea
                                    value={commentInputs[flash.id] || ''}
                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [flash.id]: e.target.value }))}
                                    placeholder='Escribi un comentario...'
                                    className='w-full min-h-[80px] bg-white/[0.02] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500/40 resize-none'
                                  />
                                  <button
                                    onClick={() => handleSubmitComment(flash.id)}
                                    disabled={!commentInputs[flash.id]?.trim()}
                                    className='self-end px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-40 flex items-center gap-2'
                                  >
                                    <Send size={12} />
                                    Comentar
                                  </button>
                                </div>
                              </>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
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
