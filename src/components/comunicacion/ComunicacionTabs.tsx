'use client'

import { useState } from 'react'
import { ArticleEditor } from './ArticleEditor'
import { ArticleManagementList } from './ArticleManagementList'
import { PenTool, ListOrdered } from 'lucide-react'

export function ComunicacionTabs({ member, articles }: any) {
  const [activeTab, setActiveTab] = useState<'redactar' | 'gestionar'>('gestionar')

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-white/5 pb-1">
        <button
          onClick={() => setActiveTab('redactar')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'redactar' 
              ? 'border-blue-500 text-white' 
              : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          <PenTool size={18} />
          Redactar Nuevo
        </button>
        <button
          onClick={() => setActiveTab('gestionar')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'gestionar' 
              ? 'border-blue-500 text-white' 
              : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          <ListOrdered size={18} />
          Gestionar Publicados
        </button>
      </div>

      <div className="mt-8">
        {activeTab === 'redactar' ? (
          <ArticleEditor member={member} />
        ) : (
          <ArticleManagementList articles={articles} />
        )}
      </div>
    </div>
  )
}
