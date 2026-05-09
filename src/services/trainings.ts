import { createClient } from '@/lib/supabase/server'
import type { Training, TrainingEnrollment } from '@/types/database'

export async function getPublicTrainings(): Promise<Training[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trainings')
    .select('*')
    .eq('is_public', true)
    .in('status', ['planificada', 'en_curso', 'finalizada'])
    .order('start_date', { ascending: false })

  if (error) {
    console.error('[trainingService] getPublicTrainings error:', error.message)
    return []
  }
  return data ?? []
}

export async function getAllTrainings(): Promise<Training[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trainings')
    .select('*')
    .order('start_date', { ascending: false })

  if (error) {
    console.error('[trainingService] getAllTrainings error:', error.message)
    return []
  }
  return data ?? []
}

export async function getTrainingById(id: string): Promise<Training | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trainings')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function enrollInTraining(
  trainingId: string,
  memberId: string
): Promise<TrainingEnrollment | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('training_enrollments')
    .insert({ training_id: trainingId, member_id: memberId })
    .select()
    .single()

  if (error) {
    console.error('[trainingService] enrollInTraining error:', error.message)
    return null
  }
  return data
}

export async function getMemberEnrollments(memberId: string): Promise<TrainingEnrollment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('training_enrollments')
    .select('*')
    .eq('member_id', memberId)

  if (error) return []
  return data ?? []
}
