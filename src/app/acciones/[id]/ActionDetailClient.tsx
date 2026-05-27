'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { ActionRegistrationForm } from '@/components/acciones/ActionRegistrationForm'
import { Calendar, MapPin, Users, Info, ChevronLeft, Sparkles, FileText } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es, enUS, pt } from 'date-fns/locale'

interface ActionDetailClientProps {
  action: any
}

export function ActionDetailClient({ action }: ActionDetailClientProps) {
  const { language, dict } = useLanguage()

  // Buscar traducción en el diccionario
  const translation = (dict.impactSection as any).feedData?.[action.id]
  const displayTitle = translation?.title || action.title
  const displayDescription = translation?.description || action.description || ''

  // Traducción de etiquetas dinámicas del tipo
  const displayType = action.type === 'capacitacion' 
    ? (language === 'en' ? 'Training' : language === 'pt' ? 'Capacitação' : 'Capacitación') 
    : action.type === 'evento_social' 
      ? (language === 'en' ? 'Social Event' : language === 'pt' ? 'Evento Social' : 'Evento Social') 
      : (language === 'en' ? 'Outreach' : language === 'pt' ? 'Divulgação' : 'Divulgación')

  // Textos estáticos traducidos
  const tVolver = language === 'en' ? 'Back to Catalog' : language === 'pt' ? 'Voltar ao Catálogo' : 'Volver al Catálogo'
  const tSobreAccion = language === 'en' ? 'About this action' : language === 'pt' ? 'Sobre esta ação' : 'Sobre esta acción'
  const tPublicoObjetivo = language === 'en' ? 'Target Audience' : language === 'pt' ? 'Público Alvo' : 'Público Objetivo'
  const tAbiertoComunidad = language === 'en' ? 'Open to the community' : language === 'pt' ? 'Aberto à comunidade' : 'Abierto a la comunidad'
  const tInversionCosto = language === 'en' ? 'Investment / Cost' : language === 'pt' ? 'Investimento / Custo' : 'Inversión / Costo'
  const tActividadGratuita = language === 'en' ? 'Free Activity' : language === 'pt' ? 'Atividade Gratuita' : 'Actividad Gratuita'
  const tInscripcion = language === 'en' ? 'Registration' : language === 'pt' ? 'Inscrição' : 'Inscripción'
  const tCompletaDatos = language === 'en' ? 'Complete your details to secure your spot.' : language === 'pt' ? 'Preencha seus dados para garantir sua vaga.' : 'Completá tus datos para asegurar tu lugar.'
  const tInscripcionesCerradas = language === 'en' ? 'Registration Closed' : language === 'pt' ? 'Inscrições Encerradas' : 'Inscripciones Cerradas'
  const tFinalizadoCupos = language === 'en' ? 'This action has already ended or capacity is full.' : language === 'pt' ? 'Esta ação já terminou ou as vagas estão esgotadas.' : 'Esta acción ya ha finalizado o los cupos están completos.'
  const tDisclaimer = language === 'en' ? 'By registering, you accept our internal communication policy. You will receive a reminder via email or phone days before the event.' : language === 'pt' ? 'Ao inscrever-se, você aceita nossa política de comunicação interna. Você receberá um lembrete via e-mail ou telefone dias antes do evento.' : 'Al inscribirte, aceptás nuestra política de comunicación interna. Recibirás un recordatorio vía email o teléfono días antes del evento.'
  const tSelloItec = language === 'en' ? 'ITEC Seal' : language === 'pt' ? 'Selo ITEC' : 'Sello ITEC'
  const tGarantiaCalidad = language === 'en' ? 'Institutional and technical quality guarantee.' : language === 'pt' ? 'Garantia de qualidade institucional e técnica.' : 'Garantía de calidad institucional y técnica.'
  
  const tPreguntasExpositor = language === 'en' ? 'Questions to the Speaker' : language === 'pt' ? 'Perguntas ao Palestrante' : 'Preguntas al Expositor'
  const tPreguntasDesc = language === 'en' ? 'The event is in progress. Send your questions to the speaker in real-time or vote on other attendees\' questions.' : language === 'pt' ? 'O evento está em andamento. Envie suas perguntas ao palestrante em tempo real ou vote nas de outros participantes.' : 'El evento está en curso. Enviá tus preguntas al expositor en tiempo real o votá las de otros asistentes.'
  const tParticiparQA = language === 'en' ? 'Participate in Q&A' : language === 'pt' ? 'Participar do Q&A' : 'Participar del Q&A'
  
  const tNubeIdeas = language === 'en' ? 'Live Word Cloud' : language === 'pt' ? 'Nuvem de Ideias ao Vivo' : 'Nube de Ideas en Vivo'
  const tNubeDesc = language === 'en' ? 'The event is in progress. Share your concepts or keywords in real-time and join the collective cloud.' : language === 'pt' ? 'O evento está em andamento. Compartilhe seus conceitos ou palavras-chave em tempo real e junte-se à nuvem coletiva.' : 'El evento está en curso. Compartí tus conceptos o palabras clave en tiempo real y sumate a la nube colectiva.'
  const tParticiparNube = language === 'en' ? 'Participate in Word Cloud' : language === 'pt' ? 'Participar da Nuvem' : 'Participar de la Nube'

  const formattedDate = action.start_date 
    ? format(new Date(action.start_date), language === 'en' ? "EEEE, MMMM d" : "EEEE d 'de' MMMM", { 
        locale: language === 'en' ? enUS : language === 'pt' ? pt : es 
      }) 
    : (language === 'en' ? 'To be defined' : language === 'pt' ? 'A definir' : 'Fecha a definir')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
      
      {/* ─── LADO IZQUIERDO: DETALLES ─── */}
      <div className="lg:col-span-2 space-y-10">
        <div className="space-y-6">
          <Link href="/acciones" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-white transition-colors text-xs uppercase font-bold tracking-widest group">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            {tVolver}
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
            {displayType}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {displayTitle}
          </h1>
          
          <div className="flex flex-wrap gap-6 items-center pt-4">
            <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold">
              <Calendar size={18} className="text-blue-400" />
              <span className="capitalize">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold">
              <MapPin size={18} className="text-blue-400" />
              <span>{action.location || 'Sede ITEC'}</span>
            </div>
          </div>
        </div>

        {/* Thumbnail Hero */}
        <div className="aspect-video relative rounded-3xl overflow-hidden border border-white/5 bg-white/[0.02]">
          {action.thumbnail_url ? (
            <img src={action.thumbnail_url} alt={displayTitle} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-10">
              <Sparkles size={120} />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Info size={20} className="text-blue-400" />
            {tSobreAccion}
          </h2>
          <div className="text-[var(--text-secondary)] leading-relaxed space-y-4">
            {displayDescription.split('\n').map((para: string, i: number) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>

        {/* Información Adicional Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{tPublicoObjetivo}</p>
            <p className="text-white font-medium">{action.target_audience || tAbiertoComunidad}</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{tInversionCosto}</p>
            <p className="text-white font-medium">{action.cost > 0 ? `$${action.cost}` : tActividadGratuita}</p>
          </div>
        </div>
      </div>

      {/* ─── LADO DERECHO: INSCRIPCIÓN ─── */}
      <div className="lg:sticky lg:top-32 space-y-6">
        <div className="glass border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl shadow-blue-900/10">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">{tInscripcion}</h3>
            <p className="text-[var(--text-muted)] text-xs">{tCompletaDatos}</p>
          </div>
          
          {action.status === 'planificacion' || action.status === 'en_curso' ? (
            <ActionRegistrationForm actionId={action.id} capacity={action.capacity} />
          ) : (
            <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-2">
              <p className="text-red-400 font-bold text-xs uppercase tracking-widest">{tInscripcionesCerradas}</p>
              <p className="text-[var(--text-muted)] text-[10px]">{tFinalizadoCupos}</p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="pt-4 flex items-start gap-3 opacity-40">
            <FileText size={16} className="shrink-0 mt-1" />
            <p className="text-[10px] leading-relaxed">
              {tDisclaimer}
            </p>
          </div>
        </div>

        {/* Badge de ITEC */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
            i
          </div>
          <div>
            <p className="text-[10px] font-bold text-white uppercase tracking-widest">{tSelloItec}</p>
            <p className="text-[var(--text-muted)] text-[10px]">{tGarantiaCalidad}</p>
          </div>
        </div>

        {/* Live Tools Sections if Event is Active */}
        {action.status === 'en_curso' && (
          <>
            {/* Q&A Section */}
            <div className="glass border border-indigo-500/20 bg-indigo-500/5 rounded-3xl p-8 space-y-4 shadow-2xl">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="text-indigo-400 animate-pulse" size={20} />
                {tPreguntasExpositor}
              </h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                {tPreguntasDesc}
              </p>
              <Link
                href={`/eventos/${action.id}/preguntar`}
                className="w-full flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-[0.98] text-sm uppercase tracking-wider"
              >
                {tParticiparQA}
              </Link>
            </div>

            {/* Nube de Ideas Section */}
            <div className="glass border border-purple-500/20 bg-purple-500/5 rounded-3xl p-8 space-y-4 shadow-2xl">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="text-purple-400 animate-pulse" size={20} />
                {tNubeIdeas}
              </h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                {tNubeDesc}
              </p>
              <Link
                href={`/eventos/${action.id}/nube`}
                className="w-full flex items-center justify-center gap-2 bg-purple-650 hover:bg-purple-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-[0.98] text-sm uppercase tracking-wider"
              >
                {tParticiparNube}
              </Link>
            </div>
          </>
        )}
      </div>

    </div>
  )
}
