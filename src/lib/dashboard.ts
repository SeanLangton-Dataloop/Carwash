import { createClient } from '@/lib/supabase-server'
import { getMondayOf } from '@/lib/wages'

export interface DashboardStats {
  todayRevenue: number
  weekRevenue: number
  monthRevenue: number
  monthWashCount: number
  monthCashTotal: number
  monthCardTotal: number
}

export interface RevenueDay {
  date: string
  revenue: number
  weatherCode: number | null
  weatherLabel: string | null
  tempMaxC: number | null
}

export interface ServiceRevenue {
  service: string
  revenue: number
}

export interface WeeklyMetrics {
  week: string
  revenue: number
  cos: number
}

export async function getDashboardStats(siteId: string): Promise<DashboardStats> {
  const supabase = await createClient()
  const tz = 'Africa/Johannesburg'
  const today = new Date().toLocaleDateString('en-CA', { timeZone: tz })
  const monthPrefix = today.slice(0, 7)
  const weekStart = getMondayOf(today)

  const [{ data: todayRow }, { data: weekRows }, { data: monthRows }] = await Promise.all([
    supabase
      .from('daily_revenue')
      .select('total_revenue')
      .eq('site_id', siteId)
      .eq('date', today)
      .maybeSingle(),
    supabase
      .from('daily_revenue')
      .select('total_revenue')
      .eq('site_id', siteId)
      .gte('date', weekStart)
      .lte('date', today),
    supabase
      .from('daily_revenue')
      .select('total_revenue, wash_count, cash_total, card_total')
      .eq('site_id', siteId)
      .gte('date', `${monthPrefix}-01`)
      .lte('date', today),
  ])

  const monthData = monthRows ?? []

  return {
    todayRevenue: todayRow?.total_revenue ?? 0,
    weekRevenue: (weekRows ?? []).reduce((sum, r) => sum + r.total_revenue, 0),
    monthRevenue: monthData.reduce((sum, r) => sum + r.total_revenue, 0),
    monthWashCount: monthData.reduce((sum, r) => sum + r.wash_count, 0),
    monthCashTotal: monthData.reduce((sum, r) => sum + r.cash_total, 0),
    monthCardTotal: monthData.reduce((sum, r) => sum + r.card_total, 0),
  }
}

export async function getRevenueByDay(siteId: string, days: number): Promise<RevenueDay[]> {
  const supabase = await createClient()
  const tz = 'Africa/Johannesburg'
  const today = new Date().toLocaleDateString('en-CA', { timeZone: tz })

  const startD = new Date(today + 'T00:00:00Z')
  startD.setUTCDate(startD.getUTCDate() - (days - 1))
  const start = startD.toISOString().slice(0, 10)

  const [{ data: revenueRows }, { data: weatherRows }] = await Promise.all([
    supabase
      .from('daily_revenue')
      .select('date, total_revenue')
      .eq('site_id', siteId)
      .gte('date', start)
      .lte('date', today)
      .order('date'),
    supabase
      .from('daily_weather')
      .select('date, weather_code, weather_label, temp_max_c')
      .eq('site_id', siteId)
      .gte('date', start)
      .lte('date', today),
  ])

  const weatherByDate = new Map((weatherRows ?? []).map(w => [w.date, w]))
  const revenueByDate = new Map((revenueRows ?? []).map(r => [r.date, r.total_revenue]))

  const result: RevenueDay[] = []
  let current = start
  while (current <= today) {
    const weather = weatherByDate.get(current)
    result.push({
      date: current,
      revenue: revenueByDate.get(current) ?? 0,
      weatherCode: weather?.weather_code ?? null,
      weatherLabel: weather?.weather_label ?? null,
      tempMaxC: weather?.temp_max_c ?? null,
    })
    const d = new Date(current + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() + 1)
    current = d.toISOString().slice(0, 10)
  }
  return result
}

export async function getRevenueByServiceType(siteId: string, month: string): Promise<ServiceRevenue[]> {
  const supabase = await createClient()

  const { data: revenueRows } = await supabase
    .from('daily_revenue')
    .select('id')
    .eq('site_id', siteId)
    .gte('date', `${month}-01`)
    .lte('date', `${month}-31`)

  const revenueIds = (revenueRows ?? []).map(r => r.id)
  if (revenueIds.length === 0) return []

  const { data: lineItems } = await supabase
    .from('revenue_line_items')
    .select('service_type, line_total')
    .in('daily_revenue_id', revenueIds)

  const byService = new Map<string, number>()
  for (const item of lineItems ?? []) {
    byService.set(item.service_type, (byService.get(item.service_type) ?? 0) + item.line_total)
  }

  return Array.from(byService.entries())
    .map(([service, revenue]) => ({ service, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
}

export async function getCostVsRevenue(siteId: string, month: string): Promise<WeeklyMetrics[]> {
  const supabase = await createClient()

  const [{ data: revenueRows }, { data: costRows }] = await Promise.all([
    supabase
      .from('daily_revenue')
      .select('date, total_revenue')
      .eq('site_id', siteId)
      .gte('date', `${month}-01`)
      .lte('date', `${month}-31`),
    supabase
      .from('costs')
      .select('date, amount')
      .eq('site_id', siteId)
      .eq('category', 'cos')
      .gte('date', `${month}-01`)
      .lte('date', `${month}-31`),
  ])

  function weekLabel(date: string): string {
    const day = parseInt(date.slice(8, 10), 10)
    if (day <= 7) return 'Wk 1'
    if (day <= 14) return 'Wk 2'
    if (day <= 21) return 'Wk 3'
    return 'Wk 4'
  }

  const weeks = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4']
  const revenueByWeek = new Map<string, number>(weeks.map(w => [w, 0]))
  const costByWeek = new Map<string, number>(weeks.map(w => [w, 0]))

  for (const r of revenueRows ?? []) {
    const wk = weekLabel(r.date)
    revenueByWeek.set(wk, (revenueByWeek.get(wk) ?? 0) + r.total_revenue)
  }
  for (const c of costRows ?? []) {
    const wk = weekLabel(c.date)
    costByWeek.set(wk, (costByWeek.get(wk) ?? 0) + c.amount)
  }

  return weeks.map(wk => ({
    week: wk,
    revenue: revenueByWeek.get(wk) ?? 0,
    cos: costByWeek.get(wk) ?? 0,
  }))
}
