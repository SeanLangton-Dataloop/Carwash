import { createClient } from './supabase-server'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from './types'

export async function getUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = data?.role
  if (role === 'admin' || role === 'manager') return role
  return null
}
