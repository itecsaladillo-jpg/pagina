import { createClient } from '@/lib/supabase/server'
import type { ItecAction, ActionRegistration } from '@/types/database'

export async function getPublicTrainings(): Promise<ItecAction[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('itec_actions')
    .select('*')
    .eq('type', 'capacitacion')
    .in('status', ['planificacion', 'en_curso', 'finalizada'])
    .order('start_date', { ascending: false })

  if (error) {
    console.error('[trainingService] getPublicTrainings error:', error.message)
    return []
  }
  return data ?? []
}

export async function getAllTrainings(): Promise<ItecAction[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('itec_actions')
    .select('*')
    .order('start_date', { ascending: false })

  if (error) {
    console.error('[trainingService] getAllTrainings error:', error.message)
    return []
  }
  return data ?? []
}

export async function getTrainingById(id: string): Promise<ItecAction | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('itec_actions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}
