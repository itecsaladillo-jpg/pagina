'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export function ComisionesSection() {
  const { dict } = useLanguage()

  const comisiones = [
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
        </svg>
      ),
      color: 'from-blue-500 to-cyan-500',
      glow: 'rgba(59,130,246,0.3)',
      title: dict.comisiones.comisionesList.innovacion.title,
      description: dict.comisiones.comisionesList.innovacion.desc,
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
        </svg>
      ),
      color: 'from-violet-500 to-purple-600',
      glow: 'rgba(139,92,246,0.3)',
      title: dict.comisiones.comisionesList.educacion.title,
      description: dict.comisiones.comisionesList.educacion.desc,
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-emerald-500 to-teal-500',
      glow: 'rgba(16,185,129,0.3)',
      title: dict.comisiones.comisionesList.finanzas.title,
      description: dict.comisiones.comisionesList.finanzas.desc,
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      color: 'from-amber-500 to-orange-500',
      glow: 'rgba(245,158,11,0.3)',
      title: dict.comisiones.comisionesList.vinculacion.title,
      description: dict.comisiones.comisionesList.vinculacion.desc,
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
        </svg>
      ),
      color: 'from-pink-500 to-rose-500',
      glow: 'rgba(236,72,153,0.3)',
      title: dict.comisiones.comisionesList.difusion.title,
      description: dict.comisiones.comisionesList.difusion.desc,
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
      ),
      color: 'from-indigo-500 to-blue-600',
      glow: 'rgba(99,102,241,0.3)',
      title: dict.comisiones.comisionesList.museo.title,
      description: dict.comisiones.comisionesList.museo.desc,
    },
  ]

  return (
    <section id="comisiones" className="py-16 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_1fr] gap-10 lg:gap-14 items-start">
          {/* Header — columna izquierda */}
          <div className="text-left">
            <span className="inline-block text-xs font-bold tracking-[0.2em] text-[var(--accent-warm)] uppercase mb-4 px-4 py-1.5 rounded-full border border-[var(--accent-warm)]/20 bg-[var(--accent-warm)]/5">
              {dict.comisiones.badge}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-[1.1] tracking-tighter">
              {dict.comisiones.heading.split(' ')[0]}
              <br />
              <span className="text-gradient block">{dict.comisiones.heading.split(' ').slice(1).join(' ')}</span>
            </h2>
            <p className="text-[var(--text-secondary)] text-lg leading-snug max-w-[320px] whitespace-pre-line">
              {dict.comisiones.desc}
            </p>
          </div>

          {/* Grid de comisiones — columna derecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {comisiones.map((com, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 card-hover group cursor-default border border-[var(--border-subtle)]"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  {/* Ícono */}
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${com.color} flex items-center justify-center flex-shrink-0 text-white shadow-lg transition-shadow group-hover:shadow-xl`}
                    style={{ '--glow': com.glow } as React.CSSProperties}
                  >
                    {com.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white mb-1.5">{com.title}</h3>
                    <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                      {com.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
