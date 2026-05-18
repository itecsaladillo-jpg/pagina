'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'

export async function createPollAction(name: string, questions: { text: string, options: string[], chart_type: string }[]) {
  try {
    const member = await getCurrentMember()
    if (!member) return { success: false, error: 'No autorizado' }

    const supabase = await createClient()

    // Insert poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({ name, is_active: false })
      .select('id')
      .single()

    if (pollError) throw pollError

    // Insert questions and options
    for (const q of questions) {
      const { data: questionData, error: qError } = await supabase
        .from('poll_questions')
        .insert({ poll_id: poll.id, text: q.text, chart_type: q.chart_type })
        .select('id')
        .single()

      if (qError) throw qError

      const optionsData = q.options.map(opt => ({
        question_id: questionData.id,
        text: opt
      }))

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsData)

      if (optionsError) throw optionsError
    }

    revalidatePath('/dashboard/encuestas')
    return { success: true }
  } catch (err: any) {
    console.error('[createPoll]', err)
    return { success: false, error: 'Error al crear la encuesta' }
  }
}

export async function togglePollStatusAction(pollId: string, makeActive: boolean) {
  try {
    const member = await getCurrentMember()
    if (!member) return { success: false, error: 'No autorizado' }

    const supabase = await createClient()

    // Si la vamos a activar, desactivamos todas las demás primero
    if (makeActive) {
      await supabase.from('polls').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000') // truco para actualizar todas
    }

    const { error } = await supabase
      .from('polls')
      .update({ is_active: makeActive })
      .eq('id', pollId)

    if (error) throw error

    revalidatePath('/dashboard/encuestas')
    revalidatePath('/votar')
    return { success: true }
  } catch (err: any) {
    console.error('[togglePoll]', err)
    return { success: false, error: 'Error al cambiar estado' }
  }
}

export async function deletePollAction(pollId: string) {
  try {
    const member = await getCurrentMember()
    if (!member) return { success: false, error: 'No autorizado' }

    const supabase = await createClient()

    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId)

    if (error) throw error

    revalidatePath('/dashboard/encuestas')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: 'Error al borrar la encuesta' }
  }
}

export async function submitSingleVoteAction(optionId: string, questionId: string, pollId: string) {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    
    // Verificamos si ya votó en esta pregunta específica
    const hasVotedQuestion = cookieStore.get(`voted_q_${questionId}`)

    if (hasVotedQuestion) {
      return { success: false, error: 'Ya has respondido esta pregunta.' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('poll_votes')
      .insert({ option_id: optionId })

    if (error) throw error

    // Marcamos esta pregunta como votada
    cookieStore.set(`voted_q_${questionId}`, 'true', {
      maxAge: 60 * 60 * 24 * 30, // 30 días
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })

    return { success: true }
  } catch (err: any) {
    console.error('[submitSingleVote]', err)
    return { success: false, error: 'Error al registrar el voto' }
  }
}

export async function markPollAsCompletedAction(pollId: string) {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    
    // Marcamos la encuesta entera como completada
    cookieStore.set(`voted_${pollId}`, 'true', {
      maxAge: 60 * 60 * 24 * 30, // 30 días
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })
    
    return { success: true }
  } catch (err: any) {
    return { success: false }
  }
}
