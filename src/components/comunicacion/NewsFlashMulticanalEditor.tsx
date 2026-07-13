'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Type, 
  Eye,
  Users,
  Building2,
  Newspaper,
  Globe,
  CheckSquare,
  Square,
  X,
  CheckCircle
} from 'lucide-react'

interface MulticanalResult {
  titulo: string
  texto_publico: string
  texto_miembros: string
  texto_sponsors: string
  texto_medios: string
}

interface NewsFlashMulticanalEditorProps {
   onSave: (data: {
     titulo: string
     datos_crudos: string
     texto_publico: string
     texto_miembros: string
     texto_sponsors: string
     texto_medios: string
     para_publico: boolean
     para_miembros: boolean
     para_sponsors: boolean
     para_medios: boolean
     commission_id?: string | null
   }) => Promise<{ success?: boolean; error?: string | null }>
   onCancel?: () => void
 }

 export function NewsFlashMulticanalEditor({ onSave, onCancel }: NewsFlashMulticanalEditorProps) {
   const [rawFacts, setRawFacts] = useState('')
   const [result, setResult] = useState<MulticanalResult | null>(null)
   const [isProcessing, setIsProcessing] = useState(false)
   const [isSaving, setIsSaving] = useState(false)
   const [activeTab, setActiveTab] = useState<'preview' | 'publico' | 'miembros' | 'sponsors' | 'medios'>('preview')
   const [errorBanner, setErrorBanner] = useState<string | null>(null)
   const [successBanner, setSuccessBanner] = useState<string | null>(null)
   
   // Checkboxes de destinatarios
   const [paraPublico, setParaPublico] = useState(true)
   const [paraMiembros, setParaMiembros] = useState(true)
   const [paraSponsors, setParaSponsors] = useState(false)
   const [paraMedios, setParaMedios] = useState(true)

   const handleProcess = async () => {
     setErrorBanner(null)
     if (!rawFacts.trim() || rawFacts.length < 20) {
       alert('Ingresá al menos 20 caracteres en las notas crudas')
       return
     }

     setIsProcessing(true)
     try {
       console.log('[UI] Procesando notas crudas...')
       const res = await fetch('/api/news/process', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ datos_crudos: rawFacts })
       })

       const data = await res.json()
       console.log('[UI] Respuesta recibida:', data)
       
       if (data.success) {
         setResult(data.result)
         setActiveTab('preview')
       } else {
         setErrorBanner(data.error || 'Error desconocido al procesar con IA')
       }
     } catch (err: any) {
       console.error('[UI] Error de conexión:', err)
       setErrorBanner('Error de conexión con Gemini: ' + (err.message || 'Verifique su conexión'))
     } finally {
       setIsProcessing(false)
     }
   }

const handleSave = async () => {
     console.log('[UI] Guardando noticia multicanal...')
     
     if (!result) {
       setErrorBanner('Procesá las notas con IA antes de guardar')
       return
     }

     setIsSaving(true)
     setErrorBanner(null)
     
     try {
       const res = await onSave({
         titulo: result.titulo,
         datos_crudos: rawFacts,
         texto_publico: result.texto_publico,
         texto_miembros: result.texto_miembros,
         texto_sponsors: result.texto_sponsors,
         texto_medios: result.texto_medios,
         para_publico: paraPublico,
         para_miembros: paraMiembros,
         para_sponsors: paraSponsors,
         para_medios: paraMedios
       })

       if (res?.error) {
         console.error('[UI] Error del servidor:', res.error)
         setErrorBanner(res.error)
       } else {
         console.log('[UI] Noticia guardada exitosamente')
         setSuccessBanner('Noticia publicada exitosamente en los muros')
         setTimeout(() => setSuccessBanner(null), 5000)
       }
     } catch (err: any) {
       console.error('[UI] Error guardando:', err)
       setErrorBanner('Error al guardar en base de datos: ' + (err.message || 'Error desconocido'))
     } finally {
       setIsSaving(false)
     }
   }

  const tabs = [
    { id: 'preview', label: 'Previsualización', icon: Eye, disabled: !result },
    { id: 'publico', label: 'Público', icon: Globe },
    { id: 'miembros', label: 'Miembros', icon: Users },
    { id: 'sponsors', label: 'Sponsors', icon: Building2 },
    { id: 'medios', label: 'Medios', icon: Newspaper },
  ]

return (
     <div className="space-y-6">
       {/* Banner de Error */}
       <AnimatePresence>
         {errorBanner && (
           <motion.div
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400"
           >
             <X size={18} className="flex-shrink-0" />
             <span className="text-sm font-medium">{errorBanner}</span>
             <button
               onClick={() => setErrorBanner(null)}
               className="ml-auto text-red-400 hover:text-red-300"
             >
               <X size={14} />
             </button>
           </motion.div>
         )}
       </AnimatePresence>

       {/* Banner de Éxito */}
       <AnimatePresence>
         {successBanner && (
           <motion.div
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400"
           >
             <CheckCircle size={18} className="flex-shrink-0" />
             <span className="text-sm font-medium">{successBanner}</span>
           </motion.div>
         )}
       </AnimatePresence>

       <div className="glass border border-white/5 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Type className="text-blue-400" size={20} />
          </div>
          <h2 className="text-xl font-bold text-white">Notas Crudas del Evento</h2>
        </div>

        <textarea
          value={rawFacts}
          onChange={(e) => setRawFacts(e.target.value)}
          placeholder="Ej: 'Hoy inauguramos el laboratorio de Robótica con 30 estudiantes, el intendente cortó la cinta, los chicos mostraron un brazo mecánico controlado por IA...'"
          className="w-full min-h-[150px] bg-white/[0.02] border border-white/10 rounded-2xl p-5 text-white text-sm leading-relaxed focus:outline-none focus:border-blue-500/40 transition-all resize-none"
        />

        {/* Checkboxes de Destinatarios */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Destinatarios</h3>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <button onClick={() => setParaPublico(!paraPublico)} className="text-blue-400">
                {paraPublico ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
              <span className="text-sm text-white">Público General</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <button onClick={() => setParaMiembros(!paraMiembros)} className="text-emerald-400">
                {paraMiembros ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
              <span className="text-sm text-white">Miembros</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <button onClick={() => setParaSponsors(!paraSponsors)} className="text-amber-400">
                {paraSponsors ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
              <span className="text-sm text-white">Sponsors</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <button onClick={() => setParaMedios(!paraMedios)} className="text-purple-400">
                {paraMedios ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
              <span className="text-sm text-white">Medios</span>
            </label>
          </div>
        </div>

        <button
          onClick={handleProcess}
          disabled={isProcessing || rawFacts.length < 20}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-30 shadow-xl"
        >
          {isProcessing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Procesando con IA...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Procesar con IA
            </>
          )}
        </button>
      </div>

      {/* Resultado en Tabs */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass border border-white/5 rounded-3xl overflow-hidden"
          >
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-1 p-2 bg-white/[0.02] border-b border-white/5">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    disabled={tab.disabled}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-30 ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Tab Content */}
            <div className="p-6 max-h-[500px] overflow-y-auto">
{activeTab === 'preview' && (
                 <div className="space-y-6">
                   <p className="text-xs text-white/40">Previsualización - Editá abajo antes de guardar</p>
                   
                   <div>
                     <h4 className="text-xs font-bold text-indigo-400 uppercase mb-2">Título Generado por IA</h4>
                     <p className="text-lg font-bold text-white mb-4">{result.titulo}</p>
                   </div>
                   
                   {paraPublico && (
                     <div>
                       <h4 className="text-xs font-bold text-blue-400 uppercase mb-2">Público</h4>
                       <p className="text-sm text-white/80 line-clamp-3">{result.texto_publico}</p>
                     </div>
                   )}
                   
                   {paraMiembros && (
                     <div>
                       <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2">Miembros</h4>
                       <p className="text-sm text-white/80 line-clamp-3">{result.texto_miembros}</p>
                     </div>
                   )}
                   
                   {paraSponsors && (
                     <div>
                       <h4 className="text-xs font-bold text-amber-400 uppercase mb-2">Sponsors</h4>
                       <p className="text-sm text-white/80 line-clamp-3">{result.texto_sponsors}</p>
                     </div>
                   )}
                   
                   {paraMedios && (
                    <div>
                      <h4 className="text-xs font-bold text-purple-400 uppercase mb-2">Medios</h4>
                      <p className="text-sm text-white/80 line-clamp-3">{result.texto_medios}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'publico' && (
                <textarea
                  value={result.texto_publico}
                  onChange={(e) => setResult({...result, texto_publico: e.target.value})}
                  className="w-full min-h-[200px] bg-white/[0.02] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-blue-500/40"
                  placeholder="Texto para público general..."
                />
              )}

              {activeTab === 'miembros' && (
                <textarea
                  value={result.texto_miembros}
                  onChange={(e) => setResult({...result, texto_miembros: e.target.value})}
                  className="w-full min-h-[200px] bg-white/[0.02] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-500/40"
                  placeholder="Texto para miembros..."
                />
              )}

              {activeTab === 'sponsors' && (
                <textarea
                  value={result.texto_sponsors}
                  onChange={(e) => setResult({...result, texto_sponsors: e.target.value})}
                  className="w-full min-h-[200px] bg-white/[0.02] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-amber-500/40"
                  placeholder="Texto para sponsors..."
                />
              )}

              {activeTab === 'medios' && (
                <textarea
                  value={result.texto_medios}
                  onChange={(e) => setResult({...result, texto_medios: e.target.value})}
                  className="w-full min-h-[200px] bg-white/[0.02] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-purple-500/40"
                  placeholder="Gacetilla periodística..."
                />
              )}
            </div>

{/* Acciones */}
             <div className="p-6 border-t border-white/5 flex gap-3">
               {onCancel && (
                 <button
                   onClick={onCancel}
                   disabled={isSaving}
                   className="flex-1 py-3 rounded-xl border border-white/5 text-white/60 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all disabled:opacity-30"
                 >
                   Cancelar
                 </button>
               )}
               <button
                 onClick={handleSave}
                 disabled={isSaving || !result}
                 className="flex-[2] py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-30"
               >
                 {isSaving ? (
                   <>
                     <Loader2 size={14} className="animate-spin" />
                     Publicando...
                   </>
                 ) : (
                   <>
                     <Send size={14} />
                     Confirmar y Publicar
                   </>
                 )}
               </button>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
     </div>
   )
 }