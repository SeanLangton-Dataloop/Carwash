import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import UsersClient from './UsersClient'

export default async function UsersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, site_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin' || !profile.site_id) redirect('/dashboard')

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .eq('site_id', profile.site_id)
    .order('created_at')

  return <UsersClient users={users ?? []} currentUserId={user.id} />
}
