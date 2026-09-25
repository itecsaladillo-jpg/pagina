export interface HistoricalAction {
  id: string
  title: string
  year: number
  date?: string
  category: string
  socialUrl: string
  platform: 'instagram' | 'facebook' | 'youtube' | 'linkedin' | 'web'
  description?: string
}

export const HISTORICAL_ACTIONS_DATA: Record<number, HistoricalAction[]> = {
  2025: [
    {
      id: '2025-1',
      title: 'El DRONE como herramienta para el agro y la salud – Jornada junto a TecnoDrones Saladillo',
      year: 2025,
      date: 'Abril 2025',
      category: 'Tecnología Agropecuaria',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Jornada de intercambio y aprendizaje sobre el impacto de la tecnología de drones en la producción agropecuaria y la salud.'
    },
    {
      id: '2025-2',
      title: 'Firma de convenio con el Cluster InfoTech Patagónico y nuevo Embajador de Buena Voluntad',
      year: 2025,
      date: 'Mayo 2025',
      category: 'Institucional',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Nombramiento de Jesús Alberto Almada como Embajador y alianza estratégica para potenciar el ecosistema tecnológico.'
    },
    {
      id: '2025-3',
      title: 'Lanzamiento de la Plataforma para Cursos y Capacitaciones a distancia',
      year: 2025,
      date: 'Junio 2025',
      category: 'Educación Virtual',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Acceso libre y gratuito a cursos técnicos y científicos desarrollados por ITEC para toda la comunidad.'
    },
    {
      id: '2025-4',
      title: 'Cuando la herramienta se vuelve obstáculo: Educación en tiempos de Inteligencia Artificial',
      year: 2025,
      date: 'Julio 2025',
      category: 'Inteligencia Artificial',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Masterclass a cargo del Bioingeniero Pedro Benedetti (ITBA - CONICET) para formadores y docentes.'
    },
    {
      id: '2025-5',
      title: 'Ciclo CHARLAS ITEC: Ideas que inspiran y transforman Saladillo',
      year: 2025,
      date: 'Agosto 2025',
      category: 'Divulgación',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Presentaciones breves y dinámicas con expertos saladillenses compartiendo visiones innovadoras.'
    },
    {
      id: '2025-6',
      title: '3ª EXPO ITEC "Augusto Cicaré" 2025: Gran muestra de innovación comunitaria',
      year: 2025,
      date: 'Noviembre 2025',
      category: 'Exposición',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Encuentro interactivo anual con stands, prototipos, robótica y proyectos productivos de Saladillo.'
    },
    {
      id: '2025-7',
      title: 'Ganadería de Precisión: Masterclass técnica con el Dr. Luciano González',
      year: 2025,
      date: 'Septiembre 2025',
      category: 'Agrotech',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Análisis de analítica de datos aplicada a la ganadería en la Cooperativa Agrícola Ganadera de Saladillo.'
    },
    {
      id: '2025-8',
      title: 'Consolidación del primer Embajador Científico-Tecnológico en la Universidad de Sydney (Australia)',
      year: 2025,
      date: 'Septiembre 2025',
      category: 'Internacional',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Proyección internacional para conectar la investigación de punta con las cadenas de valor de nuestra región.'
    },
    {
      id: '2025-9',
      title: 'Puntos Digitales en localidades rurales junto a la Cooperativa Eléctrica de Saladillo (CES)',
      year: 2025,
      date: 'Octubre 2025',
      category: 'Conectividad',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Iniciativa para llevar conectividad, alfabetización digital e inclusión a las comunidades del interior.'
    },
    {
      id: '2025-10',
      title: 'Misión técnica de la Universidad Nacional de La Plata a Agrosilo TPS y Cicaré S.A.',
      year: 2025,
      date: 'Octubre 2025',
      category: 'Vinculación Universitaria',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Visita de la Facultad de Ingeniería de Materiales (UNLP) para articular desarrollo industrial y académico.'
    },
    {
      id: '2025-11',
      title: 'Capacitación virtual y gratuita en Biotecnología desarrollada con ARGENBIO',
      year: 2025,
      date: 'Octubre 2025',
      category: 'Biotecnología',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Formación para docentes, alumnos de colegios agrarios, prensa y profesionales del sector.'
    },
    {
      id: '2025-12',
      title: 'Curso intensivo de Soldadura Industrial dictado por la Ing. Silvia Purificatto (EEST N°1)',
      year: 2025,
      date: 'Noviembre 2025',
      category: 'Oficios Técnicos',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Entrenamiento técnico de alta precisión en las instalaciones de la Escuela Técnica N°1 de Saladillo.'
    },
    {
      id: '2025-13',
      title: 'Expo móvil de Automación Micro: Automatización neumática e industrial en Plaza de los Inmigrantes y CFR',
      year: 2025,
      date: 'Noviembre 2025',
      category: 'Automatización',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Demostraciones prácticas e interactivas de automatización neumática para estudiantes y profesionales.'
    },
    {
      id: '2025-14',
      title: 'Jornadas de capacitación técnica y artística de PLANTEC en Casa SOBA',
      year: 2025,
      date: 'Noviembre 2025',
      category: 'Ciencia y Arte',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Taller sobre materiales artísticos, técnicas mixtas, expresión plástica, ciencia y tecnología con Conny Mellien.'
    },
    {
      id: '2025-15',
      title: 'Participación en el 3° Congreso de Agroalimentos en la EESA N°1 de Cazón',
      year: 2025,
      date: 'Diciembre 2025',
      category: 'Agroindustria',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Conferencias especializadas de Frigorífico Angelani, ACA MICAMPO y operadores de drones agrícolas.'
    }
  ],
  2024: [
    {
      id: '2024-1',
      title: '2ª EXPO ITEC "AUGUSTO CICARÉ" (22 y 23 de Noviembre 2024)',
      year: 2024,
      date: '22 y 23 de Noviembre 2024',
      category: 'Exposición',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Dos días intensos de stands interactivos, proyectos de escuelas técnicas, robótica, IA y tecnología saladillense.'
    },
    {
      id: '2024-2',
      title: 'Curso de UNREAL ENGINE 5 – 12 becas para formación en renderizado 3D y videojuegos',
      year: 2024,
      date: 'Febrero a Agosto 2024',
      category: 'Capacitación Digital',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Formación de alto nivel para estudiantes, arquitectos, diseñadores industriales y creadores de contenido.'
    },
    {
      id: '2024-3',
      title: 'Ciclo de charlas en la Fiesta de la Galleta de Piso: Microorganismos, trigo y harinas locales',
      year: 2024,
      date: '5 y 6 de Abril 2024',
      category: 'Alimentos y Tradición',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Conferencias científicas sobre alimentos, trigo regional y procesos de molienda del Molino SICSA.'
    },
    {
      id: '2024-4',
      title: 'Tendencias e Innovación en Panificados: Trabajo conjunto con CICSA – INTI – ITEC',
      year: 2024,
      date: '16 de Abril 2024',
      category: 'Agroalimentos',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Capacitación intensiva en calidad de harinas, formulación de nuevos ingredientes y optimización de recetas.'
    },
    {
      id: '2024-5',
      title: 'Mejora de la calidad, reducción de costos y desarrollo de alimentos sustentables (INTI / CONICET)',
      year: 2024,
      date: '6 de Septiembre 2024',
      category: 'Ciencia Aplicada',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Workshop con investigadoras del CIDCA – CONICET – UNLP en la EESA N°1 de Cazón.'
    },
    {
      id: '2024-6',
      title: 'Ciclo de charlas de emprendedurismo: "De la pasión a la acción"',
      year: 2024,
      date: 'Julio 2024',
      category: 'Emprendedurismo',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Encuentro interactivo para impulsar vocaciones emprendedoras y proyectos tecnológicos locales.'
    },
    {
      id: '2024-7',
      title: 'Designación de Embajadores de Buena Voluntad: Gustavo Larroca y Andrés Angelani',
      year: 2024,
      date: 'Julio 2024',
      category: 'Institucional',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Reconocimiento a referentes de Saladillo que promueven los valores de la innovación y el trabajo comunitario.'
    },
    {
      id: '2024-8',
      title: 'Avances técnicos sobre fallas con aplicaciones electrónicas – Ing. Juan José Martínez',
      year: 2024,
      date: 'Septiembre 2024',
      category: 'Electrónica',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Programa de 4 clases de diagnóstico electrónico y resolución de fallas en equipamiento técnico.'
    },
    {
      id: '2024-9',
      title: 'Peques ITEC: Acercando la Ciencia y la Tecnología a los niños en Biblioteca Julio Moreno',
      year: 2024,
      date: 'Septiembre 2024',
      category: 'Niñeces y Ciencia',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: '6 talleres lúdicos y experimentales para fomentar la curiosidad científica en las infancias de Saladillo.'
    },
    {
      id: '2024-10',
      title: 'Tecnología e innovación en el sector agroganadero en la Expo Rural de Saladillo',
      year: 2024,
      date: '21 de Septiembre 2024',
      category: 'Agroganadería',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Ciclo de conferencias a cargo de 5 profesionales de vanguardia en la Sociedad Rural de Saladillo.'
    },
    {
      id: '2024-11',
      title: 'Hormigones sostenibles y hormigón elaborado – Loma Negra y Colegio de Arquitectos DVIII',
      year: 2024,
      date: '26 de Septiembre 2024',
      category: 'Construcción Sustentable',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Asesoría técnica y capacitación a cargo de José Víctor Tejeda y Marcelo Cidades.'
    },
    {
      id: '2024-12',
      title: 'Cuando el arte se expresa, ciencia lleva: Espectáculo de divulgación científica y arte',
      year: 2024,
      date: 'Octubre 2024',
      category: 'Arte y Divulgación',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Propuesta multidisciplinaria con médicos, kinesiólogos y musicoterapeutas acercando el conocimiento.'
    }
  ],
  2023: [
    {
      id: '2023-1',
      title: '1ª EXPO ITEC "AUGUSTO CICARÉ" (21 de Noviembre de 2023)',
      year: 2023,
      date: '21 de Noviembre 2023',
      category: 'Hito Fundacional',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Primera edición histórica de la Expo ITEC conmemorando el natalicio del legendario inventor Augusto Cicaré.'
    },
    {
      id: '2023-2',
      title: 'Festival de Ciencia y Tecnología Augusto Cicaré para escuelas de Saladillo',
      year: 2023,
      date: 'Noviembre 2023',
      category: 'Educación Técnica',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Muestra interactiva de robótica, programación, física aplicada y proyectos escolares para toda la región.'
    },
    {
      id: '2023-3',
      title: 'Presentación Institucional del ITEC Saladillo ante la comunidad y autoridades',
      year: 2023,
      date: 'Septiembre 2023',
      category: 'Institucional',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Presentación formal de los ejes estratégicos, comisiones de trabajo y visión de futuro de la ONG.'
    },
    {
      id: '2023-4',
      title: 'Circuito Móvil de Educación Vial en Saladillo con Vialidad de la Pcia. de Buenos Aires',
      year: 2023,
      date: 'Noviembre 2023',
      category: 'Seguridad y Comunidad',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Actividad lúdica y formativa adaptada para alumnos de educación inicial y primaria.'
    },
    {
      id: '2023-5',
      title: 'Talleres preparatorios de robótica y vocaciones tecnológicas juveniles',
      year: 2023,
      date: 'Octubre 2023',
      category: 'Robótica',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Seminarios prácticos para acercar los lenguajes de programación y el diseño de circuitos a jóvenes de Saladillo.'
    },
    {
      id: '2023-6',
      title: 'Sanción de la Ordenanza Municipal de apoyo al Instituto Tecnológico de Saladillo',
      year: 2023,
      date: 'Julio 2023',
      category: 'Marco Legal',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Reconocimiento del Honorable Concejo Deliberante al ITEC como motor de desarrollo del conocimiento local.'
    }
  ],
  2022: [
    {
      id: '2022-1',
      title: 'Homenaje y Proclamación del Legado de Augusto Ulderico "Pirincho" Cicaré',
      year: 2022,
      date: 'Enero - Mayo 2022',
      category: 'Legado Cicaré',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Homenaje a la trayectoria del genio inventor de helicópteros y consolidación de su espíritu en la creación del ITEC.'
    },
    {
      id: '2022-2',
      title: 'Fundación del Instituto Tecnológico de Saladillo (ITEC) y formulación de estatutos',
      year: 2022,
      date: 'Mayo 2022',
      category: 'Fundación',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Constitución del ITEC como asociación civil sin fines de lucro para vincular educación, ciencia y producción.'
    },
    {
      id: '2022-3',
      title: 'Presentación del Parque Solar Saladillo I (Cazón) "Contador Mario Cabitto"',
      year: 2022,
      date: 'Octubre 2022',
      category: 'Energías Renovables',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Articulación comunitaria en torno al parque de 550 paneles solares y 330 kWp inyectados a la red interconectada.'
    },
    {
      id: '2022-4',
      title: 'Primeras mesas de articulación público-privada para la educación técnica en Saladillo',
      year: 2022,
      date: 'Noviembre 2022',
      category: 'Articulación',
      socialUrl: 'https://www.instagram.com/itec_saladillo/',
      platform: 'instagram',
      description: 'Reuniones de trabajo con industriales, cámaras empresarias, escuelas técnicas y el gobierno municipal.'
    }
  ]
}

export const HISTORICAL_YEARS = [2022, 2023, 2024, 2025] as const
