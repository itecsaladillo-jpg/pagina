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
export type IdeaStatus = 'nueva' | 'en_revision' | 'aprobada' | 'rechazada' | 'implementada'
export type SponsorTier = 'platino' | 'oro' | 'plata' | 'bronce'
export type ActionType = 'capacitacion' | 'evento_social' | 'divulgacion'
export type ActionStatus = 'planificacion' | 'en_curso' | 'finalizada' | 'cancelada'

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
  updated_at: string
  title: string
  description: string
  author_id: string | null
  author_name: string | null
  commission_id: string | null
  status: IdeaStatus
  upvotes: number
  is_anonymous: boolean
  tags: string[]
  admin_notes: string | null
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
        Insert: Omit<Idea, 'id' | 'created_at' | 'updated_at' | 'upvotes'>
        Update: Partial<Omit<Idea, 'id' | 'created_at'>>
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
    }
  }
}
