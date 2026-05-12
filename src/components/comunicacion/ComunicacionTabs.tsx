'use client'

import { useState } from 'react'
import { ArticleEditor } from './ArticleEditor'
import { ArticleManagementList } from './ArticleManagementList'
import { FlashManagementList } from './FlashManagementList'
import { ActionManagementList } from './ActionManagementList'
import { PenTool, ListOrdered, Zap, Calendar } from 'lucide-react'

export function ComunicacionTabs({ member, articles, flashes, actions }: any) {
  const [activeTab, setActiveTab] = useState<'redactar' | 'gestionar' | 'flashes' | 'acciones'>('gestionar')
  const [editingArticle, setEditingArticle] = useState<any>(null)

  const handleEditArticle = (article: any) => {
    setEditingArticle(article)
    setActiveTab('redactar')
  }

  const handleCancelEdit = () => {
    setEditingArticle(null)
    setActiveTab('gestionar')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 border-b border-white/5 pb-1">
        <button
          onClick={() => { setActiveTab('gestionar'); setEditingArticle(null); }}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'gestionar' 
              ? 'border-blue-500 text-white' 
              : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          <ListOrdered size={18} />
          Artículos ({articles.length})
        </button>
        {/* ... (rest of buttons) */}
        <button
          onClick={() => setActiveTab('flashes')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'flashes' 
              ? 'border-amber-500 text-white' 
              : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          <Zap size={18} />
          Flashes ({flashes.length})
        </button>
        <button
          onClick={() => setActiveTab('acciones')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'acciones' 
              ? 'border-purple-500 text-white' 
              : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          <Calendar size={18} />
          Acciones ({actions.length})
        </button>
        <button
          onClick={() => { setActiveTab('redactar'); setEditingArticle(null); }}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'redactar' 
              ? 'border-emerald-500 text-white' 
              : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          <PenTool size={18} />
          {editingArticle ? 'Editando Artículo' : 'Redactar Nuevo'}
        </button>
      </div>

      <div className="mt-8">
        {activeTab === 'gestionar' && (
          <ArticleManagementList articles={articles} onEdit={handleEditArticle} />
        )}
        {activeTab === 'flashes' && <FlashManagementList flashes={flashes} />}
        {activeTab === 'acciones' && <ActionManagementList actions={actions} />}
        {activeTab === 'redactar' && (
          <ArticleEditor 
            member={member} 
            initialArticle={editingArticle} 
            onCancel={handleCancelEdit}
          />
        )}
      </div>
    </div>
  )
}
