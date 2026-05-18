'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'

export async function createPollAction(question: string, options: string[]) {
  try {
    const member = await getCurrentMember()
    if (!member) return { success: false, error: 'No autorizado' }

    const supabase = await createClient()

    // Insert poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({ question, is_active: false })
      .select('id')
      .single()

    if (pollError) throw pollError

    // Insert options
    const optionsData = options.map(opt => ({
      poll_id: poll.id,
      text: opt
    }))

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsData)

    if (optionsError) throw optionsError

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

export async function submitVoteAction(optionId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('poll_votes')
      .insert({ option_id: optionId })

    if (error) throw error

    return { success: true }
  } catch (err: any) {
    console.error('[submitVote]', err)
    return { success: false, error: 'Error al registrar el voto' }
  }
}
