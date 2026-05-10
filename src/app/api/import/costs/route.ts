import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const MAX_BYTES = 5 * 1024 * 1024

const EXPECTED_HEADERS = ['date', 'category', 'description', 'amount', 'notes']
const VALID_CATEGORIES = ['cos', 'capex'] as const

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

type ValidCategory = (typeof VALID_CATEGORIES)[number]

interface CostInsert {
  site_id: string
  date: string
  category: ValidCategory
  description: string
  amount: number
  notes: string | null
  created_by: string
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
    category: headers.indexOf('category'),
    description: headers.indexOf('description'),
    amount: headers.indexOf('amount'),
    notes: headers.indexOf('notes'),
  }

  const dataRows = rows.slice(1)

  let imported = 0
  let errors = 0
  const errorDetails: string[] = []
  const batch: CostInsert[] = []

  function addError(msg: string) {
    errors++
    if (errorDetails.length < 10) errorDetails.push(msg)
  }

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]!
    const rowNum = i + 2 // 1-indexed, accounting for header

    const date = row[idx.date]?.trim() ?? ''
    const category = row[idx.category]?.trim() ?? ''
    const description = row[idx.description]?.trim() ?? ''
    const amountStr = row[idx.amount]?.trim() ?? ''
    const notes = row[idx.notes]?.trim() ?? ''

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      addError(`Row ${rowNum}: invalid date "${date}"`)
      continue
    }

    if (!VALID_CATEGORIES.includes(category as ValidCategory)) {
      addError(
        `Row ${rowNum} (${date}): invalid category "${category}" — must be "cos" or "capex"`,
      )
      continue
    }

    if (!description) {
      addError(`Row ${rowNum} (${date}): description is required`)
      continue
    }

    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) {
      addError(`Row ${rowNum} (${date}): invalid amount "${amountStr}"`)
      continue
    }

    batch.push({
      site_id: siteId,
      date,
      category: category as ValidCategory,
      description,
      amount,
      notes: notes || null,
      created_by: userId,
    })
  }

  // Batch insert in chunks of 200
  const CHUNK = 200
  for (let i = 0; i < batch.length; i += CHUNK) {
    const chunk = batch.slice(i, i + CHUNK)
    const { error: insertError } = await supabase.from('costs').insert(chunk)
    if (insertError) {
      errors += chunk.length
      if (errorDetails.length < 10) {
        errorDetails.push(`Batch insert failed: ${insertError.message}`)
      }
    } else {
      imported += chunk.length
    }
  }

  return Response.json({ imported, skipped: 0, errors, errorDetails })
}
