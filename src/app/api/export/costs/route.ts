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

function csvCell(val: string | null | undefined): string {
  if (!val) return ''
  return val.includes(',') || val.includes('"') || val.includes('\n')
    ? `"${val.replace(/"/g, '""')}"`
    : val
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

  let query = supabase
    .from('costs')
    .select('date, category, description, amount, notes')
    .eq('site_id', siteId)
    .order('date', { ascending: true })

  if (start) query = query.gte('date', start)
  if (end) query = query.lte('date', end)

  const { data: costs } = await query

  const header = 'date,category,description,amount,notes'
  const csvRows: string[] = [header]

  for (const c of costs ?? []) {
    csvRows.push(
      [
        csvCell(c.date),
        csvCell(c.category),
        csvCell(c.description),
        num(c.amount),
        csvCell(c.notes),
      ].join(','),
    )
  }

  const csv = csvRows.join('\n') + '\n'
  const today = new Date().toISOString().slice(0, 10)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="costs-${today}.csv"`,
    },
  })
}
