import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import AttendanceClient from './AttendanceClient'

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { date: rawDate } = await searchParams
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })
  const date = typeof rawDate === 'string' ? rawDate : today

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

  const [{ data: staffRows }, { data: attendanceRows }] = await Promise.all([
    supabase
      .from('staff')
      .select('id, full_name, role')
      .eq('site_id', profile.site_id)
      .eq('is_active', true)
      .order('full_name'),
    supabase
      .from('attendance')
      .select('staff_id, present')
      .eq('site_id', profile.site_id)
      .eq('date', date),
  ])

  const initialPresent: Record<string, boolean> = {}
  for (const row of attendanceRows ?? []) {
    initialPresent[row.staff_id] = row.present
  }

  return (
    <AttendanceClient
      date={date}
      staff={staffRows ?? []}
      initialPresent={initialPresent}
    />
  )
}
