'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Eye, 
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { deleteArticleAction } from '@/app/dashboard/comunicacion/actions'
import { PublicArticle } from '@/services/news'
import Link from 'next/link'

interface ArticleManagementListProps {
  articles: PublicArticle[]
  onEdit: (article: PublicArticle) => void
}

export function ArticleManagementList({ articles: initialArticles, onEdit }: ArticleManagementListProps) {
  const [articles, setArticles] = useState(initialArticles)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que querés eliminar este artículo?')) return
    
    setIsDeleting(id)
    try {
      const res = await deleteArticleAction(id)
      if (res.success) {
        setArticles(prev => prev.filter(a => a.id !== id))
      } else {
        alert('Error: ' + res.error)
      }
    } catch (err) {
      alert('Error al eliminar')
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="glass border border-white/5 rounded-3xl overflow-hidden mt-12">
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <FileText className="text-blue-400" size={24} />
            Gestión de Contenido
          </h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">Administrá las historias publicadas en el Muro de Impacto</p>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
          {articles.length} Artículos
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] uppercase font-black tracking-widest text-white/40 border-b border-white/5">
              <th className="px-8 py-5">Artículo</th>
              <th className="px-8 py-5">Estado</th>
              <th className="px-8 py-5">Fecha</th>
              <th className="px-8 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <AnimatePresence>
              {articles.map((article) => (
                <motion.tr 
                  key={article.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="group hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      {article.media_urls?.[0] ? (
                        <img 
                          src={article.media_urls[0]} 
                          className="w-12 h-12 rounded-xl object-cover border border-white/10" 
                          alt="" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                          <FileText size={20} className="text-white/20" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                          {article.title}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] font-medium mt-1">
                          /{article.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {article.is_published ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase">
                        <CheckCircle2 size={12} />
                        Publicado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase">
                        <Clock size={12} />
                        Borrador
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-xs text-white/60 font-medium">
                      {format(new Date(article.created_at), "d MMM, yyyy", { locale: es })}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        href={`/articulo/${article.slug || article.id}`}
                        target="_blank"
                        title="Ver en vivo"
                        className="p-2 rounded-lg bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <ExternalLink size={16} />
                      </Link>
                      <button 
                        onClick={() => onEdit(article)}
                        title="Editar"
                        className="p-2 rounded-lg bg-white/5 border border-white/5 text-white/40 hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/20 transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(article.id)}
                        disabled={isDeleting === article.id}
                        title="Eliminar"
                        className="p-2 rounded-lg bg-white/5 border border-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all disabled:opacity-30"
                      >
                        {isDeleting === article.id ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                            <Clock size={16} />
                          </motion.div>
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {articles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-20">
                    <AlertCircle size={48} />
                    <p className="text-sm font-medium">No hay artículos para mostrar</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
