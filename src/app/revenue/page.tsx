import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { formatZAR } from '@/lib/format'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatDate(dateStr: string): string {
  const parts = dateStr.split('-')
  const month = parseInt(parts[1] ?? '1', 10)
  const day = parseInt(parts[2] ?? '1', 10)
  return `${day} ${MONTHS[month - 1] ?? ''} ${parts[0] ?? ''}`
}

function formatMissedDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()] ?? ''}`
}

function shiftDate(base: string, n: number): string {
  const d = new Date(base + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export default async function RevenuePage() {
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

  if (!profile?.site_id) redirect('/dashboard')

  const { data: entries } = await supabase
    .from('daily_revenue')
    .select('id, date, total_revenue, cash_total, card_total, wash_count')
    .eq('site_id', profile.site_id)
    .order('date', { ascending: false })

  const rows = entries ?? []

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })
  const entryDateSet = new Set(rows.map(r => r.date))

  // Last 30 days: from 30 days ago up to yesterday (today may not be entered yet)
  const missedDays: string[] = []
  for (let i = 30; i >= 1; i--) {
    const d = shiftDate(today, -i)
    if (!entryDateSet.has(d)) {
      missedDays.push(d)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-neutral-900">Revenue</h1>
          <Link
            href="/revenue/new"
            className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-600 active:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 min-h-[44px]"
          >
            Log today
          </Link>
        </div>

        {/* Missed days */}
        <div className="rounded-xl bg-white shadow-sm border border-neutral-200 p-4 md:p-6">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-sm font-semibold text-neutral-900">Days without data</h2>
            {missedDays.length > 0 ? (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                {missedDays.length} {missedDays.length === 1 ? 'day' : 'days'}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                All caught up
              </span>
            )}
          </div>
          {missedDays.length === 0 ? (
            <p className="text-sm text-neutral-500">No missing entries in the last 30 days.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {missedDays.map(date => (
                <Link
                  key={date}
                  href={`/revenue/new?date=${date}`}
                  className="inline-flex items-center rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800 transition-colors hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
                >
                  {formatMissedDate(date)}
                </Link>
              ))}
            </div>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
            <p className="text-sm font-semibold text-neutral-900">No revenue entries yet</p>
            <p className="mt-1 text-sm text-neutral-500">
              Log your first day's revenue to get started.
            </p>
            <div className="mt-4">
              <Link
                href="/revenue/new"
                className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 min-h-[44px]"
              >
                Log today's revenue
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Washes
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Total
                  </th>
                  <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Cash
                  </th>
                  <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Card
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {rows.map(row => (
                  <tr key={row.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/revenue/${row.date}`}
                        className="text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
                      >
                        {formatDate(row.date)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-neutral-900">
                      {row.wash_count}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-right text-neutral-900">
                      {formatZAR(row.total_revenue)}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-sm text-right text-neutral-700">
                      {formatZAR(row.cash_total)}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-sm text-right text-neutral-700">
                      {formatZAR(row.card_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
