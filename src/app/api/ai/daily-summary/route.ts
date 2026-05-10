import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// TODO (v2 full implementation):
// 1. Fetch daily_revenue rows + revenue_line_items for the given date and site
// 2. Fetch daily_weather for the date and site
// 3. Fetch attendance records for the date and site (with staff names)
// 4. Build a structured prompt summarising the day:
//    - Total revenue, wash count, top services
//    - Weather conditions and any correlation with revenue
//    - Staff present, total wage cost, gross margin
// 5. Call the Anthropic API (claude-haiku-4-5 for cost efficiency) with the prompt
// 6. Return the generated narrative text as { summary: string }

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as unknown
  const date =
    body !== null && typeof body === 'object' && 'date' in body
      ? (body as Record<string, unknown>).date
      : undefined

  if (typeof date !== 'string' || !date.trim()) {
    return Response.json({ error: 'date is required' }, { status: 400 })
  }

  return Response.json({
    summary: 'AI daily summary will be available in a future update.',
  })
}
