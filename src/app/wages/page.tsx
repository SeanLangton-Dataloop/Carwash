import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import WagesClient from './WagesClient'
import { getMondayOf, addDays, calculateWeeklyWages } from '@/lib/wages'
import type { StaffForWages } from '@/lib/wages'
import type { PayType } from '@/lib/types'

export default async function WagesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { week: rawWeek } = await searchParams
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })
  const weekStart = getMondayOf(typeof rawWeek === 'string' ? rawWeek : today)
  const weekEnd = addDays(weekStart, 6)

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
      .select('id, full_name, role, pay_type, daily_rate, monthly_salary')
      .eq('site_id', profile.site_id)
      .eq('is_active', true)
      .order('full_name'),
    supabase
      .from('attendance')
      .select('staff_id, date, present')
      .eq('site_id', profile.site_id)
      .gte('date', weekStart)
      .lte('date', weekEnd),
  ])

  const staff: StaffForWages[] = (staffRows ?? []).map(r => ({
    id: r.id,
    full_name: r.full_name,
    role: r.role,
    pay_type: (r.pay_type ?? 'daily_rate') as PayType,
    daily_rate: r.daily_rate,
    monthly_salary: r.monthly_salary ?? null,
  }))

  const summaries = calculateWeeklyWages(
    staff,
    attendanceRows ?? [],
    weekStart,
    weekEnd,
  )

  return (
    <WagesClient
      weekStart={weekStart}
      weekEnd={weekEnd}
      summaries={summaries}
    />
  )
}
