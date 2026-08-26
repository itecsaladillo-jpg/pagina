'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Phone, ExternalLink, Calendar } from 'lucide-react'
import { NuestrosSociosSection } from '@/components/home/NuestrosSociosSection'

interface Member {
  id: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  frase_itec: string | null;
  tareas_itec: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  join_date: string | null;
  status: string | null;
}

function MemberCard({ member, onOpen }: { member: Member; onOpen: () => void }) {
  return (
    <div onClick={onOpen} className="glass rounded-2xl p-5 flex items-center gap-5 card-hover border border-[var(--border-subtle)] relative overflow-hidden group cursor-pointer">
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-warm)]/0 to-[var(--accent-warm)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-2 border-[var(--border-subtle)] group-hover:border-[var(--accent-warm)]/50 transition-colors shadow-lg shadow-black/20">
        {member.avatar_url ? (
          <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-white/5 flex items-center justify-center text-white text-2xl font-bold">
            {member.full_name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h4 className="text-white font-semibold text-lg">{member.full_name}</h4>
          <span className="text-[10px] font-medium text-[var(--accent-warm)] bg-[var(--accent-warm)]/10 px-2.5 py-0.5 rounded-full border border-[var(--accent-warm)]/20">
            {member.role === 'admin' ? 'Administrador' : member.role === 'coordinador' ? 'Coordinador' : member.role === 'colaborador' ? 'Colaborador' : 'Miembro'}
          </span>
        </div>

        {(member.frase_itec || member.bio) && (
          <p className="text-[var(--text-secondary)] text-sm line-clamp-2 leading-relaxed italic">
            &quot;{member.frase_itec || member.bio}&quot;
          </p>
        )}
      </div>
    </div>
  )
}

export function AboutSection() {
  const { dict } = useLanguage()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  useEffect(() => {
    const fetchMembers = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('obtener_miembros_publicos')
      if (data) {
        setMembers(data as Member[])
      }
      setLoading(false)
    }
    fetchMembers()
  }, [])

  const valores = [
    {
      icon: '💡',
      letter: 'I',
      color: 'bg-yellow-400 text-gray-900',
      title: dict.about.pilares.innovacion.title,
      desc: dict.about.pilares.innovacion.desc,
    },
    {
      icon: '⚙️',
      letter: 'T',
      color: 'bg-blue-500 text-white',
      title: dict.about.pilares.tecnologia.title,
      desc: dict.about.pilares.tecnologia.desc,
    },
    {
      icon: '🚀',
      letter: 'E',
      color: 'bg-red-500 text-white',
      title: dict.about.pilares.emprendedurismo.title,
      desc: dict.about.pilares.emprendedurismo.desc,
    },
    {
      icon: '🔬',
      letter: 'C',
      color: 'bg-green-700 text-white',
      title: dict.about.pilares.ciencia.title,
      desc: dict.about.pilares.ciencia.desc,
    },
  ]

  return (
    <section id="nosotros" className="py-16 relative">
      {/* Orbe decorativo */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Texto */}
          <div>
            <span className="inline-block text-xs font-bold tracking-[0.2em] text-[var(--accent-warm)] uppercase mb-4 px-4 py-1.5 rounded-full border border-[var(--accent-warm)]/20 bg-[var(--accent-warm)]/5">
              {dict.about.badge}
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tighter">
              {dict.about.headingStart}{' '}
              <span className="text-gradient">{dict.about.headingGradient}</span>
            </h2>
            <p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-6">
              {dict.about.desc1}
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-8">
              {dict.about.desc2}
            </p>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-[var(--border-glow)] to-transparent" />
              <span className="text-[var(--text-muted)] text-sm">{dict.about.fundacion}</span>
            </div>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {valores.map((v, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 card-hover border border-[var(--border-subtle)]"
              >
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="text-white font-semibold mb-2">{v.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sección NUESTROS SOCIOS: entre NUESTRA IDENTIDAD y NUESTRO EQUIPO */}
        <div className="section-divider" />
        <NuestrosSociosSection />

        {/* Sección de Miembros ITEC */}
        <div id="equipo" className="mt-16 grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-10 lg:gap-14 items-start">
          <div className="text-left">
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-[1.1] tracking-tighter">
              Nuestro <span className="text-gradient">Equipo</span>
            </h3>
            <p className="text-[var(--text-secondary)] text-2xl leading-snug max-w-[280px]">
              Detrás de cada iniciativa del ITEC Saladillo hay un equipo comprometido con el conocimiento, la tecnología y la educación transformadora.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-[var(--accent-warm)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center text-[var(--text-secondary)] py-12 glass rounded-2xl border border-[var(--border-subtle)]">
              No hay miembros públicos disponibles en este momento.
            </div>
          ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.slice(0, 9).map((member, index) => (
                <MemberCard
                  key={member.id || `member-${index}`}
                  member={member}
                  onOpen={() => setSelectedMember(member)}
                />
              ))}
            </div>

            {members.length > 9 && (
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {members.slice(9).map((member, index) => (
                  <MemberCard
                    key={member.id || `member-wide-${index}`}
                    member={member}
                    onOpen={() => setSelectedMember(member)}
                  />
                ))}
              </div>
            )}
          </>
          )}
        </div>
      </div>

      {/* Modal de Perfil del Miembro */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0a0f1e] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              {/* Header con imagen de fondo */}
              <div className="relative h-32 bg-gradient-to-r from-[var(--accent-warm)]/20 to-violet-600/20">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="absolute top-4 right-4 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Avatar centrado */}
              <div className="flex justify-center -mt-16">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#0a0f1e] shadow-xl">
                  {selectedMember.avatar_url ? (
                    <img
                      src={selectedMember.avatar_url}
                      alt={selectedMember.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center text-white text-4xl font-bold">
                      {selectedMember.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Contenido */}
              <div className="px-6 pt-4 pb-6">
                {/* Nombre y Rol */}
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-white mb-2">{selectedMember.full_name}</h3>
                  <span className="text-xs font-medium text-[var(--accent-warm)] bg-[var(--accent-warm)]/10 px-4 py-1.5 rounded-full border border-[var(--accent-warm)]/20">
                    {selectedMember.role === 'admin' ? 'Administrador' : selectedMember.role === 'coordinador' ? 'Coordinador' : selectedMember.role === 'colaborador' ? 'Colaborador' : 'Miembro'}
                  </span>
                </div>

                {/* Bio / Frase */}
                {(selectedMember.frase_itec || selectedMember.bio) && (
                  <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed italic">
                      &quot;{selectedMember.frase_itec || selectedMember.bio}&quot;
                    </p>
                  </div>
                )}

                {/* Tareas ITEC */}
                {selectedMember.tareas_itec && (
                  <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/5">
                    <h4 className="text-white text-sm font-semibold mb-2">Tareas en ITEC</h4>
                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                      {selectedMember.tareas_itec}
                    </p>
                  </div>
                )}

                {/* Información de contacto */}
                <div className="space-y-3">
                  {selectedMember.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail size={16} className="text-[var(--accent-warm)]" />
                      <a href={`mailto:${selectedMember.email}`} className="text-[var(--text-secondary)] hover:text-white transition-colors">
                        {selectedMember.email}
                      </a>
                    </div>
                  )}

                  {selectedMember.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone size={16} className="text-[var(--accent-warm)]" />
                      <a href={`tel:${selectedMember.phone}`} className="text-[var(--text-secondary)] hover:text-white transition-colors">
                        {selectedMember.phone}
                      </a>
                    </div>
                  )}

                  {selectedMember.linkedin_url && (
                    <div className="flex items-center gap-3 text-sm">
                      <ExternalLink size={16} className="text-[var(--accent-warm)]" />
                      <a
                        href={selectedMember.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--text-secondary)] hover:text-white transition-colors"
                      >
                        LinkedIn
                      </a>
                    </div>
                  )}

                  {selectedMember.join_date && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar size={16} className="text-[var(--accent-warm)]" />
                      <span className="text-[var(--text-secondary)]">
                        Ingreso: {new Date(selectedMember.join_date).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
