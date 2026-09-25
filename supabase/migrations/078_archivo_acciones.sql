-- ============================================================
-- Migración 078: Tabla Archivo de Acciones y Eventos Históricos
-- ============================================================

CREATE TABLE IF NOT EXISTS public.archivo_acciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  social_url TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year IN (2022, 2023, 2024, 2025)),
  category TEXT DEFAULT 'General',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.members(id) ON DELETE SET NULL
);

-- Índices para ordenamiento y filtrado ágil
CREATE INDEX IF NOT EXISTS idx_archivo_acciones_year ON public.archivo_acciones (year DESC, created_at DESC);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.archivo_acciones ENABLE ROW LEVEL SECURITY;

-- Lectura pública para la landing page (sección ITEC en Movimiento)
DROP POLICY IF EXISTS "Lectura pública de archivo de acciones" ON public.archivo_acciones;
CREATE POLICY "Lectura pública de archivo de acciones"
  ON public.archivo_acciones
  FOR SELECT
  USING (true);

-- Inserción exclusiva para administradores y coordinadores
DROP POLICY IF EXISTS "Admins y coordinadores insertan archivo de acciones" ON public.archivo_acciones;
CREATE POLICY "Admins y coordinadores insertan archivo de acciones"
  ON public.archivo_acciones
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE id = auth.uid() AND role IN ('admin', 'coordinador')
    )
  );

-- Actualización exclusiva para administradores y coordinadores
DROP POLICY IF EXISTS "Admins y coordinadores actualizan archivo de acciones" ON public.archivo_acciones;
CREATE POLICY "Admins y coordinadores actualizan archivo de acciones"
  ON public.archivo_acciones
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE id = auth.uid() AND role IN ('admin', 'coordinador')
    )
  );

-- Eliminación exclusiva para administradores y coordinadores
DROP POLICY IF EXISTS "Admins y coordinadores eliminan archivo de acciones" ON public.archivo_acciones;
CREATE POLICY "Admins y coordinadores eliminan archivo de acciones"
  ON public.archivo_acciones
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE id = auth.uid() AND role IN ('admin', 'coordinador')
    )
  );

-- Semilla inicial de eventos históricos si la tabla está vacía
INSERT INTO public.archivo_acciones (title, social_url, year, category, description)
SELECT * FROM (VALUES
  ('El DRONE como herramienta para el agro y la salud – Jornada junto a TecnoDrones Saladillo', 'https://www.instagram.com/itec_saladillo/', 2025, 'Tecnología Agropecuaria', 'Jornada de intercambio y aprendizaje sobre el impacto de la tecnología de drones en la producción agropecuaria y la salud.'),
  ('Firma de convenio con el Cluster InfoTech Patagónico y nuevo Embajador de Buena Voluntad', 'https://www.instagram.com/itec_saladillo/', 2025, 'Institucional', 'Nombramiento de Jesús Alberto Almada como Embajador y alianza estratégica para potenciar el ecosistema tecnológico.'),
  ('Lanzamiento de la Plataforma para Cursos y Capacitaciones a distancia', 'https://www.instagram.com/itec_saladillo/', 2025, 'Educación Virtual', 'Acceso libre y gratuito a cursos técnicos y científicos desarrollados por ITEC para toda la comunidad.'),
  ('Cuando la herramienta se vuelve obstáculo: Educación en tiempos de Inteligencia Artificial', 'https://www.instagram.com/itec_saladillo/', 2025, 'Inteligencia Artificial', 'Masterclass a cargo del Bioingeniero Pedro Benedetti (ITBA - CONICET) para formadores y docentes.'),
  ('Ciclo CHARLAS ITEC: Ideas que inspiran y transforman Saladillo', 'https://www.instagram.com/itec_saladillo/', 2025, 'Divulgación', 'Presentaciones breves y dinámicas con expertos saladillenses compartiendo visiones innovadoras.'),
  ('3ª EXPO ITEC "Augusto Cicaré" 2025: Gran muestra de innovación comunitaria', 'https://www.instagram.com/itec_saladillo/', 2025, 'Exposición', 'Encuentro interactivo anual con stands, prototipos, robótica y proyectos productivos de Saladillo.'),
  ('Ganadería de Precisión: Masterclass técnica con el Dr. Luciano González', 'https://www.instagram.com/itec_saladillo/', 2025, 'Agrotech', 'Análisis de analítica de datos aplicada a la ganadería en la Cooperativa Agrícola Ganadera de Saladillo.'),
  ('Consolidación del primer Embajador Científico-Tecnológico en la Universidad de Sydney (Australia)', 'https://www.instagram.com/itec_saladillo/', 2025, 'Internacional', 'Proyección internacional para conectar la investigación de punta con las cadenas de valor de nuestra región.'),
  ('Puntos Digitales en localidades rurales junto a la Cooperativa Eléctrica de Saladillo (CES)', 'https://www.instagram.com/itec_saladillo/', 2025, 'Conectividad', 'Iniciativa para llevar conectividad, alfabetización digital e inclusión a las comunidades del interior.'),
  ('Misión técnica de la Universidad Nacional de La Plata a Agrosilo TPS y Cicaré S.A.', 'https://www.instagram.com/itec_saladillo/', 2025, 'Vinculación Universitaria', 'Visita de la Facultad de Ingeniería de Materiales (UNLP) para articular desarrollo industrial y académico.'),
  ('Capacitación virtual y gratuita en Biotecnología desarrollada con ARGENBIO', 'https://www.instagram.com/itec_saladillo/', 2025, 'Biotecnología', 'Formación para docentes, alumnos de colegios agrarios, prensa y profesionales del sector.'),
  ('Curso intensivo de Soldadura Industrial dictado por la Ing. Silvia Purificatto (EEST N°1)', 'https://www.instagram.com/itec_saladillo/', 2025, 'Oficios Técnicos', 'Entrenamiento técnico de alta precisión en las instalaciones de la Escuela Técnica N°1 de Saladillo.'),
  ('Expo móvil de Automación Micro: Automatización neumática e industrial en Plaza de los Inmigrantes y CFR', 'https://www.instagram.com/itec_saladillo/', 2025, 'Automatización', 'Demostraciones prácticas e interactivas de automatización neumática para estudiantes y profesionales.'),
  ('Jornadas de capacitación técnica y artística de PLANTEC en Casa SOBA', 'https://www.instagram.com/itec_saladillo/', 2025, 'Ciencia y Arte', 'Taller sobre materiales artísticos, técnicas mixtas, expresión plástica, ciencia y tecnología con Conny Mellien.'),
  ('Participación en el 3° Congreso de Agroalimentos en la EESA N°1 de Cazón', 'https://www.instagram.com/itec_saladillo/', 2025, 'Agroindustria', 'Conferencias especializadas de Frigorífico Angelani, ACA MICAMPO y operadores de drones agrícolas.'),
  ('2ª EXPO ITEC "AUGUSTO CICARÉ" (22 y 23 de Noviembre 2024)', 'https://www.instagram.com/itec_saladillo/', 2024, 'Exposición', 'Dos días intensos de stands interactivos, proyectos de escuelas técnicas, robótica, IA y tecnología saladillense.'),
  ('Curso de UNREAL ENGINE 5 – 12 becas para formación en renderizado 3D y videojuegos', 'https://www.instagram.com/itec_saladillo/', 2024, 'Capacitación Digital', 'Formación de alto nivel para estudiantes, arquitectos, diseñadores industriales y creadores de contenido.'),
  ('Ciclo de charlas en la Fiesta de la Galleta de Piso: Microorganismos, trigo y harinas locales', 'https://www.instagram.com/itec_saladillo/', 2024, 'Alimentos y Tradición', 'Conferencias científicas sobre alimentos, trigo regional y procesos de molienda del Molino SICSA.'),
  ('Tendencias e Innovación en Panificados: Trabajo conjunto con CICSA – INTI – ITEC', 'https://www.instagram.com/itec_saladillo/', 2024, 'Agroalimentos', 'Capacitación intensiva en calidad de harinas, formulación de nuevos ingredientes y optimización de recetas.'),
  ('Mejora de la calidad, reducción de costos y desarrollo de alimentos sustentables (INTI / CONICET)', 'https://www.instagram.com/itec_saladillo/', 2024, 'Ciencia Aplicada', 'Workshop con investigadoras del CIDCA – CONICET – UNLP en la EESA N°1 de Cazón.'),
  ('Ciclo de charlas de emprendedurismo: "De la pasión a la acción"', 'https://www.instagram.com/itec_saladillo/', 2024, 'Emprendedurismo', 'Encuentro interactivo para impulsar vocaciones emprendedoras y proyectos tecnológicos locales.'),
  ('Designación de Embajadores de Buena Voluntad: Gustavo Larroca y Andrés Angelani', 'https://www.instagram.com/itec_saladillo/', 2024, 'Institucional', 'Reconocimiento a referentes de Saladillo que promueven los valores de la innovación y el trabajo comunitario.'),
  ('Avances técnicos sobre fallas con aplicaciones electrónicas – Ing. Juan José Martínez', 'https://www.instagram.com/itec_saladillo/', 2024, 'Electrónica', 'Programa de 4 clases de diagnóstico electrónico y resolución de fallas en equipamiento técnico.'),
  ('Peques ITEC: Acercando la Ciencia y la Tecnología a los niños en Biblioteca Julio Moreno', 'https://www.instagram.com/itec_saladillo/', 2024, 'Niñeces y Ciencia', '6 talleres lúdicos y experimentales para fomentar la curiosidad científica en las infancias de Saladillo.'),
  ('Tecnología e innovación en el sector agroganadero en la Expo Rural de Saladillo', 'https://www.instagram.com/itec_saladillo/', 2024, 'Agroganadería', 'Ciclo de conferencias a cargo de 5 profesionales de vanguardia en la Sociedad Rural de Saladillo.'),
  ('Hormigones sostenibles y hormigón elaborado – Loma Negra y Colegio de Arquitectos DVIII', 'https://www.instagram.com/itec_saladillo/', 2024, 'Construcción Sustentable', 'Asesoría técnica y capacitación a cargo de José Víctor Tejeda y Marcelo Cidades.'),
  ('Cuando el arte se expresa, ciencia lleva: Espectáculo de divulgación científica y arte', 'https://www.instagram.com/itec_saladillo/', 2024, 'Arte y Divulgación', 'Propuesta multidisciplinaria con médicos, kinesiólogos y musicoterapeutas acercando el conocimiento.'),
  ('1ª EXPO ITEC "AUGUSTO CICARÉ" (21 de Noviembre de 2023)', 'https://www.instagram.com/itec_saladillo/', 2023, 'Hito Fundacional', 'Primera edición histórica de la Expo ITEC conmemorando el natalicio del legendario inventor Augusto Cicaré.'),
  ('Festival de Ciencia y Tecnología Augusto Cicaré para escuelas de Saladillo', 'https://www.instagram.com/itec_saladillo/', 2023, 'Educación Técnica', 'Muestra interactiva de robótica, programación, física aplicada y proyectos escolares para toda la región.'),
  ('Presentación Institucional del ITEC Saladillo ante la comunidad y autoridades', 'https://www.instagram.com/itec_saladillo/', 2023, 'Institucional', 'Presentación formal de los ejes estratégicos, comisiones de trabajo y visión de futuro de la ONG.'),
  ('Circuito Móvil de Educación Vial en Saladillo con Vialidad de la Pcia. de Buenos Aires', 'https://www.instagram.com/itec_saladillo/', 2023, 'Seguridad y Comunidad', 'Actividad lúdica y formativa adaptada para alumnos de educación inicial y primaria.'),
  ('Talleres preparatorios de robótica y vocaciones tecnológicas juveniles', 'https://www.instagram.com/itec_saladillo/', 2023, 'Robótica', 'Seminarios prácticos para acercar los lenguajes de programación y el diseño de circuitos a jóvenes de Saladillo.'),
  ('Sanción de la Ordenanza Municipal de apoyo al Instituto Tecnológico de Saladillo', 'https://www.instagram.com/itec_saladillo/', 2023, 'Marco Legal', 'Reconocimiento del Honorable Concejo Deliberante al ITEC como motor de desarrollo del conocimiento local.'),
  ('Homenaje y Proclamación del Legado de Augusto Ulderico "Pirincho" Cicaré', 'https://www.instagram.com/itec_saladillo/', 2022, 'Legado Cicaré', 'Homenaje a la trayectoria del genio inventor de helicópteros y consolidación de su espíritu en la creación del ITEC.'),
  ('Fundación del Instituto Tecnológico de Saladillo (ITEC) y formulación de estatutos', 'https://www.instagram.com/itec_saladillo/', 2022, 'Fundación', 'Constitución del ITEC como asociación civil sin fines de lucro para vincular educación, ciencia y producción.'),
  ('Presentación del Parque Solar Saladillo I (Cazón) "Contador Mario Cabitto"', 'https://www.instagram.com/itec_saladillo/', 2022, 'Energías Renovables', 'Articulación comunitaria en torno al parque de 550 paneles solares y 330 kWp inyectados a la red interconectada.'),
  ('Primeras mesas de articulación público-privada para la educación técnica en Saladillo', 'https://www.instagram.com/itec_saladillo/', 2022, 'Articulación', 'Reuniones de trabajo con industriales, cámaras empresarias, escuelas técnicas y el gobierno municipal.')
) AS t(title, social_url, year, category, description)
WHERE NOT EXISTS (SELECT 1 FROM public.archivo_acciones LIMIT 1);
