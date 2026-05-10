import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import DashboardClient from './DashboardClient'
import {
  getDashboardStats,
  getRevenueByDay,
  getRevenueByServiceType,
  getCostVsRevenue,
} from '@/lib/dashboard'
import { addDays } from '@/lib/wages'

function monthLabel(dateStr: string): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  const parts = dateStr.split('-')
  const year = parts[0] ?? ''
  const month = parseInt(parts[1] ?? '1', 10)
  return `${months[month - 1] ?? ''} ${year}`
}

export default async function DashboardPage() {
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

  if (!profile?.site_id) redirect('/settings')

  const siteId = profile.site_id
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })
  const month = today.slice(0, 7)

  const sevenDaysAgo = addDays(today, -6)

  const [stats, revenueByDay, serviceRevenue, weeklyMetrics, weekRevenueRows] = await Promise.all([
    getDashboardStats(siteId),
    getRevenueByDay(siteId, 30),
    getRevenueByServiceType(siteId, month),
    getCostVsRevenue(siteId, month),
    supabase
      .from('daily_revenue')
      .select('date')
      .eq('site_id', siteId)
      .gte('date', sevenDaysAgo)
      .lte('date', today),
  ])

  return (
    <DashboardClient
      stats={stats}
      revenueByDay={revenueByDay}
      serviceRevenue={serviceRevenue}
      weeklyMetrics={weeklyMetrics}
      monthLabel={monthLabel(today)}
      weekEntries={weekRevenueRows.data ?? []}
    />
  )
}
