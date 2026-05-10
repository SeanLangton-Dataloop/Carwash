import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { wmoCodeToLabel } from '@/lib/weather'

interface OpenMeteoResponse {
  daily: {
    time: string[]
    weathercode: number[]
    temperature_2m_max: (number | null)[]
  }
}

function datesBetween(start: string, end: string): string[] {
  const dates: string[] = []
  let current = start
  while (current <= end) {
    dates.push(current)
    const d = new Date(current + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() + 1)
    current = d.toISOString().slice(0, 10)
  }
  return dates
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end) {
    return Response.json({ error: 'start and end query params are required' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('site_id')
    .eq('id', user.id)
    .single()

  if (!profile?.site_id) {
    return Response.json({ error: 'No site associated with this account' }, { status: 400 })
  }

  const siteId = profile.site_id

  const { data: site } = await supabase
    .from('sites')
    .select('latitude, longitude')
    .eq('id', siteId)
    .single()

  if (!site?.latitude || !site?.longitude) {
    return Response.json({ weather: [] })
  }

  const allDates = datesBetween(start, end)

  const { data: cached } = await supabase
    .from('daily_weather')
    .select('date, weather_code, weather_label, temp_max_c')
    .eq('site_id', siteId)
    .gte('date', start)
    .lte('date', end)

  const cachedDates = new Set((cached ?? []).map(r => r.date))
  const missing = allDates.filter(d => !cachedDates.has(d))

  if (missing.length > 0) {
    const fetchStart = missing[0]!
    const fetchEnd = missing[missing.length - 1]!

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${site.latitude}&longitude=${site.longitude}` +
      `&daily=weathercode,temperature_2m_max` +
      `&timezone=Africa%2FJohannesburg` +
      `&start_date=${fetchStart}&end_date=${fetchEnd}`

    const res = await fetch(url, { next: { revalidate: 0 } })

    if (res.ok) {
      const json = (await res.json()) as OpenMeteoResponse
      const { time, weathercode, temperature_2m_max } = json.daily

      const rows = time.map((date, i) => ({
        site_id: siteId,
        date,
        weather_code: weathercode[i] ?? 0,
        weather_label: wmoCodeToLabel(weathercode[i] ?? 0),
        temp_max_c: temperature_2m_max[i] ?? null,
        fetched_at: new Date().toISOString(),
      }))

      await supabase
        .from('daily_weather')
        .upsert(rows, { onConflict: 'site_id,date' })
    }
  }

  const { data: all } = await supabase
    .from('daily_weather')
    .select('date, weather_code, weather_label, temp_max_c')
    .eq('site_id', siteId)
    .gte('date', start)
    .lte('date', end)
    .order('date')

  return Response.json({ weather: all ?? [] })
}
