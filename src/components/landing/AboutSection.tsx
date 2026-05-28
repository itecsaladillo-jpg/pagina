'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Member {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  frase_itec: string | null;
  tareas_itec: string | null;
  bio: string | null;
}

export function AboutSection() {
  const { dict } = useLanguage()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

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
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
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

        {/* Sección de Miembros ITEC */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">Nuestro Equipo</h3>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              Conoce a los miembros que hacen posible el ITEC Augusto Cicaré. Personas apasionadas por la tecnología, la innovación y la educación.
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-[var(--accent-warm)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : members.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {members.map((member, index) => (
                <div key={member.id || `member-${index}`} className="glass rounded-2xl p-6 flex flex-col items-center text-center card-hover border border-[var(--border-subtle)] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-warm)]/0 to-[var(--accent-warm)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-5 border-2 border-[var(--border-subtle)] group-hover:border-[var(--accent-warm)]/50 transition-colors shadow-lg shadow-black/20">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center text-white text-3xl font-bold">
                        {member.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <h4 className="text-white font-semibold text-lg mb-1">{member.full_name}</h4>
                  
                  <span className="text-xs font-medium text-[var(--accent-warm)] bg-[var(--accent-warm)]/10 px-3 py-1 rounded-full mb-2 border border-[var(--accent-warm)]/20">
                    {member.role === 'admin' ? 'Administrador' : member.role === 'coordinador' ? 'Coordinador' : member.role === 'colaborador' ? 'Colaborador' : 'Miembro'}
                  </span>
                  
                  {member.email && (
                    <a href={`mailto:${member.email}`} className="text-[11px] text-zinc-400 hover:text-[var(--accent-warm)] transition-colors mb-4 truncate w-full px-2" title={member.email}>
                      {member.email}
                    </a>
                  )}
                  
                  {(member.frase_itec || member.bio) && (
                    <p className="text-[var(--text-secondary)] text-sm line-clamp-4 leading-relaxed flex-1 italic">
                      "{member.frase_itec || member.bio}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-[var(--text-secondary)] py-12 glass rounded-2xl border border-[var(--border-subtle)]">
              No hay miembros públicos disponibles en este momento.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
