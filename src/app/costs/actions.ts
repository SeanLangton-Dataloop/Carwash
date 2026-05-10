'use server'

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createCost(params: {
  date: string
  category: 'cos' | 'capex'
  description: string
  amount: number
  notes: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('site_id')
    .eq('id', user.id)
    .single()

  if (!profile?.site_id) redirect('/dashboard')

  const { error } = await supabase.from('costs').insert({
    site_id: profile.site_id,
    date: params.date,
    category: params.category,
    description: params.description,
    amount: params.amount,
    notes: params.notes || null,
    created_by: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/costs')
  return {}
}
