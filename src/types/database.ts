/**
 * Tipos de base de datos para la plataforma ITEC Saladillo
 * Estructura sincronizada con el schema de Supabase
 * v2 — agrega Sponsors y Reportes
 */

// ─────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────

export type MemberRole = 'admin' | 'coordinador' | 'miembro' | 'colaborador'
export type MemberStatus = 'activo' | 'inactivo' | 'pendiente'
export type TrainingStatus = 'planificada' | 'en_curso' | 'finalizada' | 'cancelada'
export type IdeaStatus = 'pendiente' | 'en_revision' | 'aprobada' | 'descartada'
export type SponsorTier = 'platino' | 'oro' | 'plata' | 'bronce' | 'standard'
export type ActionType = 'capacitacion' | 'evento_social' | 'divulgacion'
export type ActionStatus = 'planificacion' | 'en_curso' | 'finalizada' | 'cancelada'

// ─────────────────────────────────────────
// PARTNERS: Clasificación de socios
// ─────────────────────────────────────────

export type PartnerType = 'SPONSOR' | 'STRATEGIC_ALLIANCE' | 'DIFFUSION_CHANNEL'

// Tipo de entidad para el modal público de la landing
export type PartnerEntityType = 'sponsor' | 'alianza' | 'difusion'

export interface PublicPartner {
  id: string
  name: string
  type: PartnerType
  tier: SponsorTier | null
  logo_color_url: string | null
  logo_url: string | null
  resena: string | null
  website_url: string | null
  email: string | null
  category: string | null
  actions_description: string | null
}

// Entidades soportadas por el modal público unificado (SponsorModal).
// Los campos de visualización son opcionales para aceptar tanto filas
// crudas de las tablas como proyecciones normalizadas (ej. PublicPartner,
// RPC obtener_socios_publicos).
export type PartnerEntity = Sponsor | StrategicPartner | MediaChannel

export interface StrategicPartner {
  id: string
  created_at?: string
  updated_at?: string
  name: string
  category?: string | null
  actions_description?: string | null
  logo_url?: string | null
  is_active?: boolean
}

export interface MediaChannel {
  id: string
  name?: string
  nombre_medio?: string | null
  tipo_medio?: string | null
  url_web?: string | null
  email?: string | null
}

// ─────────────────────────────────────────
// TABLA: members
// ─────────────────────────────────────────

export interface Member {
  id: string
  created_at: string
  updated_at: string
  full_name: string
  email: string
  avatar_url: string | null
  role: MemberRole
  status: MemberStatus
  bio: string | null
  linkedin_url: string | null
  phone: string | null
  join_date: string
  frase_itec: string | null
  tareas_itec: string | null
}

// ─────────────────────────────────────────
// TABLA: commissions
// ─────────────────────────────────────────

export interface Commission {
  id: string
  created_at: string
  updated_at: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  is_active: boolean
  coordinator_id: string | null
  meet_link: string | null
}

export interface CommissionMember {
  id: string
  commission_id: string
  member_id: string
  joined_at: string
  is_coordinator: boolean
}

// ─────────────────────────────────────────
// TABLA: itec_actions
// ─────────────────────────────────────────

export interface ItecAction {
  id: string
  created_at: string
  updated_at: string
  title: string
  description: string | null
  type: ActionType
  status: ActionStatus
  target_audience: string | null
  capacity: number | null
  cost: number
  start_date: string | null
  end_date: string | null
  location: string | null
  thumbnail_url: string | null
  tags: string[]
  responsible_id: string | null
  commission_id: string | null
  materials_urls: string[]
  media_urls: string[]
}

export interface ActionRegistration {
  id: string
  action_id: string
  full_name: string
  email: string
  phone: string | null
  registered_at: string
  attended: boolean
  notes: string | null
}

// ─────────────────────────────────────────
// TABLA: ideas
// ─────────────────────────────────────────

export interface Idea {
  id: string
  created_at: string
  idea_text: string
  is_anonymous: boolean
  author_name: string | null
  author_email: string | null
  author_phone: string | null
  status: IdeaStatus
}

// ─────────────────────────────────────────
// TABLA: sponsors
// ─────────────────────────────────────────

export interface Sponsor {
  id: string
  created_at: string
  updated_at: string
  name: string
  logo_url: string | null
  website_url: string | null
  contact_email: string | null
  tier: SponsorTier
  is_active: boolean
  description: string | null
  private_token: string
  rubro: string | null
  resena: string | null
  contacto_nombre: string | null
  contacto_telefono: string | null
  logo_monocromo_url: string | null
  logo_color_url: string | null
  // Columnas legacy (migración 036) — usadas por la ficha del admin y SponsorForm
  nombre_empresa?: string | null
  actividad?: string | null
  zona_influencia?: string | null
  nombre_contacto?: string | null
  apellido_contacto?: string | null
  telefono?: string | null
}

export interface SponsorFormData {
  name: string
  tier: SponsorTier
  rubro: string
  resena: string
  website_url?: string
  contact_name: string
  contact_phone: string
  contact_email: string
  logo_monocromo?: File
  logo_color?: File
}

// ─────────────────────────────────────────
// TABLA: sponsor_reports
// ─────────────────────────────────────────

export interface SponsorReport {
  id: string
  created_at: string
  updated_at: string
  sponsor_id: string
  period_label: string
  period_start: string
  period_end: string
  metrics: SponsorMetrics
  summary_html: string | null
  is_published: boolean
  published_at: string | null
}

export interface SponsorMetrics {
  miembros_alcanzados?: number
  capacitaciones_realizadas?: number
  ideas_apoyadas?: number
  horas_formacion?: number
  [key: string]: number | string | undefined
}

// ─────────────────────────────────────────
// TABLA: prensa_envios_log
// ─────────────────────────────────────────

export interface PrensaEnvioLog {
  id: string
  created_at: string
  news_flash_id: string
  medio_id: string | null
  medio_nombre: string
  recipient_email: string
  status: 'enviado' | 'fallido'
  error_message: string | null
  sent_by_member_id: string
}

// ─────────────────────────────────────────
// TABLA: eventos (control presencial/consola)
// ─────────────────────────────────────────

export type HerramientasActivas = {
  encuestas: boolean
  preguntas: boolean
  nube: boolean
  semaforo: boolean
}

export type ModoPantallaGigante = 'bienvenida' | 'nube' | 'encuestas' | 'preguntas'

export interface Evento {
  id: string
  created_at: string
  updated_at: string
  nombre_evento: string
  slug_qr: string
  fecha: string
  estado_activo: boolean
  modalidad: 'presencial' | 'virtual' | null
  meet_url: string | null
  herramienta_activa: 'encuestas' | 'preguntas' | 'nube_ideas'
  encuesta_activa_id: string | null
  nube_activa_id: string | null
  herramientas_activas: HerramientasActivas
  modo_pantalla_gigante: ModoPantallaGigante
  semaforo_last_reset_at: string | null
  nube_concepto: string | null
}

// ─────────────────────────────────────────
// TABLAS DE INTERACCIÓN REALTIME (Esquema Híbrido)
// ─────────────────────────────────────────

export interface ClaseVirtual {
  id: string
  titulo: string
  url_stream: string
  estado_sidebar: 'chat' | 'modometro'
  modalidad: 'presencial' | 'virtual'
  meet_url: string | null
  en_vivo?: boolean
  created_at: string
}

export type ModometroEstado = 'voy_bien' | 'me_perdi' | 'muy_rapido'

export interface ClaseModometroVoto {
  id: string
  clase_id: string
  member_id: string | null
  nombre_completo: string
  estado: ModometroEstado
  created_at: string
  updated_at: string
}

export type ManoAlzadaEstado = 'esperando' | 'atendido'

export interface ClaseManoAlzada {
  id: string
  clase_id: string
  member_id: string | null
  nombre_completo: string
  estado: ManoAlzadaEstado
  created_at: string
}

export interface ClasePregunta {
  id: string
  clase_id: string
  member_id: string | null
  nombre_completo: string
  pregunta: string
  votos_count: number
  resuelta: boolean
  created_at: string
}

export interface ClasePreguntaVoto {
  id: string
  pregunta_id: string
  member_id: string
  created_at: string
}

export interface ClaseEncuesta {
  id: string
  clase_id: string
  pregunta: string
  opciones: string[]
  activa: boolean
  created_at: string
}

export interface ClaseEncuestaRespuesta {
  id: string
  encuesta_id: string
  member_id: string
  nombre_completo: string
  opcion_index: number
  created_at: string
}

export type SemaforoColor = 'verde' | 'amarillo' | 'rojo'

export interface ClaseSemaforoVoto {
  id: string
  clase_id: string
  member_id: string | null
  nombre_completo: string
  color: SemaforoColor
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────
// TABLA: api_settings (key/value para API keys)
// ─────────────────────────────────────────

export interface ApiSetting {
  id: string
  key: string
  value: string
  updated_at: string
}

export type ApiSettingKey =
  | 'openrouter_api_key'
  | 'gemini_api_key'
  | 'resend_api_key'
  | 'groq_api_key'
  | 'hf_api_key'

// ─────────────────────────────────────────
// DATABASE TYPE (para generics de Supabase)
// ─────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      members: {
        Row: Member
        Insert: Omit<Member, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Member, 'id' | 'created_at'>>
      }
      commissions: {
        Row: Commission
        Insert: Omit<Commission, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Commission, 'id' | 'created_at'>>
      }
      commission_members: {
        Row: CommissionMember
        Insert: Omit<CommissionMember, 'id'>
        Update: Partial<Omit<CommissionMember, 'id'>>
      }
      itec_actions: {
        Row: ItecAction
        Insert: Omit<ItecAction, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ItecAction, 'id' | 'created_at'>>
      }
      action_registrations: {
        Row: ActionRegistration
        Insert: Omit<ActionRegistration, 'id' | 'registered_at'>
        Update: Partial<Omit<ActionRegistration, 'id'>>
      }
      ideas: {
        Row: Idea
        Insert: Omit<Idea, 'id' | 'created_at'>
        Update: Partial<Omit<Idea, 'id' | 'created_at'>>
      }
      prensa_envios_log: {
        Row: PrensaEnvioLog
        Insert: Omit<PrensaEnvioLog, 'id' | 'created_at'>
        Update: Partial<Omit<PrensaEnvioLog, 'id' | 'created_at'>>
      }
      sponsors: {
        Row: Sponsor
        Insert: Omit<Sponsor, 'id' | 'created_at' | 'updated_at' | 'private_token'>
        Update: Partial<Omit<Sponsor, 'id' | 'created_at' | 'private_token'>>
      }
      sponsor_reports: {
        Row: SponsorReport
        Insert: Omit<SponsorReport, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SponsorReport, 'id' | 'created_at'>>
      }
      eventos: {
        Row: Evento
        Insert: Omit<Evento, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Evento, 'id' | 'created_at'>>
      }
      api_settings: {
        Row: ApiSetting
        Insert: Omit<ApiSetting, 'id' | 'updated_at'>
        Update: Partial<Omit<ApiSetting, 'id' | 'updated_at'>>
      }
      clases_virtuales: {
        Row: ClaseVirtual
        Insert: Omit<ClaseVirtual, 'id' | 'created_at'>
        Update: Partial<Omit<ClaseVirtual, 'id' | 'created_at'>>
      }
      clase_modometro_votos: {
        Row: ClaseModometroVoto
        Insert: Omit<ClaseModometroVoto, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ClaseModometroVoto, 'id' | 'created_at'>>
      }
      clase_mano_alzada: {
        Row: ClaseManoAlzada
        Insert: Omit<ClaseManoAlzada, 'id' | 'created_at'>
        Update: Partial<Omit<ClaseManoAlzada, 'id' | 'created_at'>>
      }
      clase_preguntas: {
        Row: ClasePregunta
        Insert: Omit<ClasePregunta, 'id' | 'created_at' | 'votos_count' | 'resuelta'>
        Update: Partial<Omit<ClasePregunta, 'id' | 'created_at'>>
      }
      clase_pregunta_votos: {
        Row: ClasePreguntaVoto
        Insert: Omit<ClasePreguntaVoto, 'id' | 'created_at'>
        Update: Partial<Omit<ClasePreguntaVoto, 'id' | 'created_at'>>
      }
      clase_encuestas: {
        Row: ClaseEncuesta
        Insert: Omit<ClaseEncuesta, 'id' | 'created_at' | 'activa'>
        Update: Partial<Omit<ClaseEncuesta, 'id' | 'created_at'>>
      }
      clase_encuesta_respuestas: {
        Row: ClaseEncuestaRespuesta
        Insert: Omit<ClaseEncuestaRespuesta, 'id' | 'created_at'>
        Update: Partial<Omit<ClaseEncuestaRespuesta, 'id' | 'created_at'>>
      }
      clase_semaforo_votos: {
        Row: ClaseSemaforoVoto
        Insert: Omit<ClaseSemaforoVoto, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ClaseSemaforoVoto, 'id' | 'created_at'>>
      }
    }
  }
}
