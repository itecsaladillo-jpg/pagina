'use client'

import { useState } from 'react'
import { ArticleEditor } from './ArticleEditor'
import { ArticleManagementList } from './ArticleManagementList'
import { FlashManagementList } from './FlashManagementList'
import { PenTool, ListOrdered, Zap } from 'lucide-react'

export function ComunicacionTabs({ member, articles, flashes }: any) {
  const [activeTab, setActiveTab] = useState<'redactar' | 'gestionar' | 'flashes'>('gestionar')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 border-b border-white/5 pb-1">
        <button
          onClick={() => setActiveTab('gestionar')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'gestionar' 
              ? 'border-blue-500 text-white' 
              : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          <ListOrdered size={18} />
          Artículos Publicados
        </button>
        <button
          onClick={() => setActiveTab('flashes')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'flashes' 
              ? 'border-amber-500 text-white' 
              : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          <Zap size={18} />
          Flashes (Novedades)
        </button>
        <button
          onClick={() => setActiveTab('redactar')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'redactar' 
              ? 'border-emerald-500 text-white' 
              : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          <PenTool size={18} />
          Redactar Nuevo
        </button>
      </div>

      <div className="mt-8">
        {activeTab === 'gestionar' && <ArticleManagementList articles={articles} />}
        {activeTab === 'flashes' && <FlashManagementList flashes={flashes} />}
        {activeTab === 'redactar' && <ArticleEditor member={member} />}
      </div>
    </div>
  )
}
