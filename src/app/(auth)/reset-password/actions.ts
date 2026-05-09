'use server'

import { createClient } from '@/lib/supabase-server'

type ResetState = { error: string } | { success: true } | undefined

export async function resetPassword(
  _prevState: ResetState,
  formData: FormData
): Promise<ResetState> {
  const email = formData.get('email')

  if (typeof email !== 'string') {
    return { error: 'Invalid email.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })

  if (error) {
    return { error: 'Failed to send reset link. Please try again.' }
  }

  return { success: true }
}
