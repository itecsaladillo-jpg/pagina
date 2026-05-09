import { createClient } from '@/lib/supabase/server'
import type { Sponsor, SponsorReport } from '@/types/database'

export async function getSponsors(): Promise<Sponsor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sponsors')
    .select('*')
    .eq('is_active', true)
    .order('tier', { ascending: true })
    .order('name')

  if (error) {
    console.error('[sponsorService] getSponsors error:', error.message)
    return []
  }
  return data ?? []
}

export async function getSponsorReports(sponsorId: string): Promise<SponsorReport[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sponsor_reports')
    .select('*')
    .eq('sponsor_id', sponsorId)
    .eq('is_published', true)
    .order('period_start', { ascending: false })

  if (error) {
    console.error('[sponsorService] getSponsorReports error:', error.message)
    return []
  }
  return data ?? []
}

/**
 * Acceso público a un reporte de impacto por token privado del sponsor.
 * Se usa para generar vistas compartibles sin login.
 */
export async function getPublicReportByToken(
  token: string
): Promise<{ sponsor: Sponsor; reports: SponsorReport[] } | null> {
  const supabase = await createClient()

  const { data: sponsor, error } = await supabase
    .from('sponsors')
    .select('*')
    .eq('private_token', token)
    .eq('is_active', true)
    .single()

  if (error || !sponsor) return null

  const { data: reports } = await supabase
    .from('sponsor_reports')
    .select('*')
    .eq('sponsor_id', sponsor.id)
    .eq('is_published', true)
    .order('period_start', { ascending: false })

  return { sponsor, reports: reports ?? [] }
}
