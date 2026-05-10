import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'

const querySchema = z.object({
  start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'start must be YYYY-MM-DD')
    .optional(),
  end: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'end must be YYYY-MM-DD')
    .optional(),
})

function num(n: number): string {
  return n.toFixed(2)
}

function csvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '') return ''
  const s = String(val)
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, site_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin' || !profile.site_id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const parsed = querySchema.safeParse({
    start: url.searchParams.get('start') ?? undefined,
    end: url.searchParams.get('end') ?? undefined,
  })
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }
  const { start, end } = parsed.data
  const siteId = profile.site_id

  let revenueQuery = supabase
    .from('daily_revenue')
    .select('id, date, total_revenue, card_total, cash_total, wash_count')
    .eq('site_id', siteId)
    .order('date', { ascending: true })

  if (start) revenueQuery = revenueQuery.gte('date', start)
  if (end) revenueQuery = revenueQuery.lte('date', end)

  const { data: revenueRows } = await revenueQuery

  const header =
    'date,service_type,quantity,unit_price,line_total,day_total_income,card_total,cash_total,wash_count'

  if (!revenueRows || revenueRows.length === 0) {
    const today = new Date().toISOString().slice(0, 10)
    return new Response(header + '\n', {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="revenue-${today}.csv"`,
      },
    })
  }

  const { data: lineItems } = await supabase
    .from('revenue_line_items')
    .select('daily_revenue_id, service_type, quantity, unit_price, line_total')
    .in(
      'daily_revenue_id',
      revenueRows.map(r => r.id),
    )
    .order('daily_revenue_id')

  const linesByRevId: Record<string, Array<{ service_type: string; quantity: number; unit_price: number; line_total: number }>> =
    {}
  for (const li of lineItems ?? []) {
    if (!linesByRevId[li.daily_revenue_id]) linesByRevId[li.daily_revenue_id] = []
    linesByRevId[li.daily_revenue_id]!.push(li)
  }

  const csvRows: string[] = [header]

  for (const rev of revenueRows) {
    const lines = linesByRevId[rev.id] ?? []

    if (lines.length === 0) {
      csvRows.push(
        [
          csvCell(rev.date),
          '',
          '',
          '',
          '',
          num(rev.total_revenue),
          num(rev.card_total),
          num(rev.cash_total),
          String(rev.wash_count),
        ].join(','),
      )
    } else {
      for (let i = 0; i < lines.length; i++) {
        const li = lines[i]!
        const first = i === 0
        csvRows.push(
          [
            csvCell(rev.date),
            csvCell(li.service_type),
            String(li.quantity),
            num(li.unit_price),
            num(li.line_total),
            first ? num(rev.total_revenue) : '',
            first ? num(rev.card_total) : '',
            first ? num(rev.cash_total) : '',
            first ? String(rev.wash_count) : '',
          ].join(','),
        )
      }
    }
  }

  const csv = csvRows.join('\n') + '\n'
  const today = new Date().toISOString().slice(0, 10)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="revenue-${today}.csv"`,
    },
  })
}
