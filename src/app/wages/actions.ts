'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

async function getAdminSite() {
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

  return { supabase, userId: user.id, siteId: profile.site_id as string }
}

export interface AttendanceEntry {
  staff_id: string
  present: boolean
}

export async function saveAttendance(
  date: string,
  records: AttendanceEntry[],
): Promise<{ error?: string }> {
  const { supabase, userId, siteId } = await getAdminSite()

  const rows = records.map(r => ({
    date,
    staff_id: r.staff_id,
    site_id: siteId,
    present: r.present,
    created_by: userId,
  }))

  const { error } = await supabase
    .from('attendance')
    .upsert(rows, { onConflict: 'staff_id,date' })

  if (error) return { error: error.message }

  revalidatePath('/wages')
  revalidatePath('/wages/attendance')
  return {}
}
