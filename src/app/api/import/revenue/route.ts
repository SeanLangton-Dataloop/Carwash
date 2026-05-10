import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const MAX_BYTES = 5 * 1024 * 1024

const EXPECTED_HEADERS = [
  'date',
  'service_type',
  'quantity',
  'unit_price',
  'line_total',
  'day_total_income',
  'card_total',
  'cash_total',
  'wash_count',
]

function parseCSVLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  cells.push(current)
  return cells
}

function parseCSV(text: string): string[][] {
  return text
    .split('\n')
    .map(l => l.replace(/\r$/, ''))
    .filter(l => l.length > 0)
    .map(parseCSVLine)
}

interface LineItemInsert {
  site_id: string
  daily_revenue_id: string
  service_type: string
  vehicle_type: string
  quantity: number
  unit_price: number
  line_total: number
}

export async function POST(request: NextRequest) {
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

  const siteId = profile.site_id
  const userId = user.id

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Invalid multipart request' }, { status: 400 })
  }

  const fileField = formData.get('file')
  if (!(fileField instanceof File)) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  if (fileField.size > MAX_BYTES) {
    return Response.json({ error: 'File exceeds 5 MB limit' }, { status: 400 })
  }

  const text = await fileField.text()
  const rows = parseCSV(text)
  if (rows.length < 2) {
    return Response.json(
      { error: 'CSV must have a header row and at least one data row' },
      { status: 400 },
    )
  }

  const headers = (rows[0] ?? []).map(h => h.trim().toLowerCase())
  const missingHeaders = EXPECTED_HEADERS.filter(h => !headers.includes(h))
  if (missingHeaders.length > 0) {
    return Response.json(
      { error: `Missing columns: ${missingHeaders.join(', ')}` },
      { status: 400 },
    )
  }

  const idx = {
    date: headers.indexOf('date'),
    service_type: headers.indexOf('service_type'),
    quantity: headers.indexOf('quantity'),
    unit_price: headers.indexOf('unit_price'),
    line_total: headers.indexOf('line_total'),
    day_total_income: headers.indexOf('day_total_income'),
    card_total: headers.indexOf('card_total'),
    cash_total: headers.indexOf('cash_total'),
    wash_count: headers.indexOf('wash_count'),
  }

  const dataRows = rows.slice(1)

  // Group rows by date
  const byDate = new Map<string, string[][]>()
  for (const row of dataRows) {
    const date = row[idx.date]?.trim() ?? ''
    if (!date) continue
    if (!byDate.has(date)) byDate.set(date, [])
    byDate.get(date)!.push(row)
  }

  const allDates = [...byDate.keys()]
  const { data: existingRows } = await supabase
    .from('daily_revenue')
    .select('date')
    .eq('site_id', siteId)
    .in('date', allDates)

  const existingDateSet = new Set(existingRows?.map(r => r.date) ?? [])

  let imported = 0
  let skipped = 0
  let errors = 0
  const errorDetails: string[] = []

  function addError(msg: string) {
    errors++
    if (errorDetails.length < 10) errorDetails.push(msg)
  }

  for (const [date, dateRows] of byDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      addError(`Invalid date format: "${date}"`)
      continue
    }

    if (existingDateSet.has(date)) {
      skipped++
      continue
    }

    const firstRow = dateRows[0]!
    const dayTotal = parseFloat(firstRow[idx.day_total_income]?.trim() ?? '') || 0
    const cardTotal = parseFloat(firstRow[idx.card_total]?.trim() ?? '') || 0
    const cashTotal = parseFloat(firstRow[idx.cash_total]?.trim() ?? '') || 0
    const washCount = parseInt(firstRow[idx.wash_count]?.trim() ?? '', 10) || 0

    const { data: newRev, error: revError } = await supabase
      .from('daily_revenue')
      .insert({
        site_id: siteId,
        date,
        total_revenue: dayTotal,
        card_total: cardTotal,
        cash_total: cashTotal,
        wash_count: washCount,
        created_by: userId,
      })
      .select('id')
      .single()

    if (revError || !newRev) {
      addError(`Failed to insert ${date}: ${revError?.message ?? 'unknown error'}`)
      continue
    }

    const lineItemsToInsert: LineItemInsert[] = []

    for (const row of dateRows) {
      const serviceType = row[idx.service_type]?.trim() ?? ''
      if (!serviceType) continue // totals-only row, not a line item

      const qtyStr = row[idx.quantity]?.trim() ?? ''
      const priceStr = row[idx.unit_price]?.trim() ?? ''
      const totalStr = row[idx.line_total]?.trim() ?? ''

      const qty = parseInt(qtyStr, 10)
      const price = parseFloat(priceStr)
      const total = parseFloat(totalStr)

      if (!Number.isInteger(qty) || qty <= 0) {
        addError(`${date}/${serviceType}: invalid quantity "${qtyStr}"`)
        continue
      }
      if (isNaN(price) || price <= 0) {
        addError(`${date}/${serviceType}: invalid unit_price "${priceStr}"`)
        continue
      }
      if (isNaN(total) || total <= 0) {
        addError(`${date}/${serviceType}: invalid line_total "${totalStr}"`)
        continue
      }

      lineItemsToInsert.push({
        site_id: siteId,
        daily_revenue_id: newRev.id,
        service_type: serviceType,
        vehicle_type: '',
        quantity: qty,
        unit_price: price,
        line_total: total,
      })
    }

    if (lineItemsToInsert.length > 0) {
      const { error: liError } = await supabase
        .from('revenue_line_items')
        .insert(lineItemsToInsert)
      if (liError) {
        addError(`${date}: failed to insert line items — ${liError.message}`)
      }
    }

    imported++
  }

  return Response.json({ imported, skipped, errors, errorDetails })
}
