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

export async function updatePollAction(
  pollId: string,
  name: string,
  questions: { id?: string; text: string; chart_type: string; options: { id?: string; text: string }[] }[]
) {
  try {
    const member = await getCurrentMember()
    if (!member) return { success: false, error: 'No autorizado' }

    const supabase = await createClient()

    // 1. Update poll name
    const { error: pollError } = await supabase
      .from('polls')
      .update({ name })
      .eq('id', pollId)

    if (pollError) throw pollError

    // 2. Fetch current questions in DB for this poll
    const { data: dbQuestions, error: dbQError } = await supabase
      .from('poll_questions')
      .select('id')
      .eq('poll_id', pollId)

    if (dbQError) throw dbQError

    const dbQuestionIds = dbQuestions.map(q => q.id)
    const incomingQuestionIds = questions.filter(q => q.id).map(q => q.id!)

    // Questions to delete
    const questionIdsToDelete = dbQuestionIds.filter(id => !incomingQuestionIds.includes(id))
    if (questionIdsToDelete.length > 0) {
      const { error: deleteQError } = await supabase
        .from('poll_questions')
        .delete()
        .in('id', questionIdsToDelete)
      if (deleteQError) throw deleteQError
    }

    // 3. Process each incoming question
    for (const q of questions) {
      let questionId = q.id

      if (questionId) {
        // Update existing question
        const { error: uQError } = await supabase
          .from('poll_questions')
          .update({ text: q.text, chart_type: q.chart_type })
          .eq('id', questionId)
        if (uQError) throw uQError
      } else {
        // Insert new question
        const { data: newQ, error: iQError } = await supabase
          .from('poll_questions')
          .insert({ poll_id: pollId, text: q.text, chart_type: q.chart_type })
          .select('id')
          .single()
        if (iQError) throw iQError
        questionId = newQ.id
      }

      // Fetch current options in DB for this question (if it's an existing question)
      let dbOptionIds: string[] = []
      if (q.id) {
        const { data: dbOptions, error: dbOptError } = await supabase
          .from('poll_options')
          .select('id')
          .eq('question_id', questionId)
        if (dbOptError) throw dbOptError
        dbOptionIds = dbOptions.map(o => o.id)
      }

      const incomingOptionIds = q.options.filter(o => o.id).map(o => o.id!)

      // Options to delete
      const optionIdsToDelete = dbOptionIds.filter(id => !incomingOptionIds.includes(id))
      if (optionIdsToDelete.length > 0) {
        const { error: deleteOptError } = await supabase
          .from('poll_options')
          .delete()
          .in('id', optionIdsToDelete)
        if (deleteOptError) throw deleteOptError
      }

      // Process options
      for (const opt of q.options) {
        if (opt.id) {
          // Update existing option
          const { error: uOptError } = await supabase
            .from('poll_options')
            .update({ text: opt.text })
            .eq('id', opt.id)
          if (uOptError) throw uOptError
        } else {
          // Insert new option
          const { error: iOptError } = await supabase
            .from('poll_options')
            .insert({ question_id: questionId, text: opt.text })
          if (iOptError) throw iOptError
        }
      }
    }

    revalidatePath('/dashboard/encuestas')
    return { success: true }
  } catch (err: any) {
    console.error('[updatePoll]', err)
    return { success: false, error: 'Error al actualizar la encuesta' }
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
