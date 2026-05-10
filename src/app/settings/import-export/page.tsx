import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import ImportExportClient from '@/components/settings/ImportExportClient'

export default async function ImportExportPage() {
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

  return <ImportExportClient />
}
