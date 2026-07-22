import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import { EntrenamientoForm } from './EntrenamientoForm'
import { BrainCircuit } from 'lucide-react'

export default async function EntrenamientoAsistentePage() {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') redirect('/dashboard')

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <BrainCircuit className="text-purple-400" size={32} />
          Entrenamiento del Asistente
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Configurá la personalidad, el conocimiento base y los documentos de entrenamiento del Asistente ITEC.
        </p>
      </div>

      <EntrenamientoForm />
    </div>
  )
}
