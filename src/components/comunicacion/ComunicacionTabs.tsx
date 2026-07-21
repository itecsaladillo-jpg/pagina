'use client'

import { useState } from 'react'
import { ActionManagementList } from './ActionManagementList'
import { NewsFlashMulticanalEditor } from './NewsFlashMulticanalEditor'
import { Calendar, Radio } from 'lucide-react'
import { createMulticanalNewsAction } from '@/app/dashboard/comunicacion/actions'

export function ComunicacionTabs({ member, actions }: { member: any; actions: any[] }) {
  const [activeTab, setActiveTab] = useState<'acciones' | 'multicanal'>('multicanal')

  const handleSaveMulticanal = async (data: any) => {
    const res = await createMulticanalNewsAction(data)
    if (res.success) {
      window.location.reload()
      return { success: true }
    } else {
      return { success: false, error: res.error }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 border-b border-white/5 pb-1">
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
          onClick={() => setActiveTab('multicanal')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'multicanal' 
              ? 'border-cyan-500 text-white' 
              : 'border-transparent text-white/40 hover:text-white'
          }`}
        >
          <Radio size={18} />
          Noticia Multicanal
        </button>
      </div>

      <div className="mt-8">
        {activeTab === 'acciones' && <ActionManagementList actions={actions} />}
        {activeTab === 'multicanal' && (
          <NewsFlashMulticanalEditor 
            onSave={handleSaveMulticanal}
            onCancel={() => setActiveTab('acciones')}
          />
        )}
      </div>
    </div>
  )
}
