'use client'

import Link from 'next/link'

interface WeekTrackerProps {
  entries: { date: string }[]
}

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function shiftDate(base: string, n: number): string {
  const d = new Date(base + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function dayAbbr(dateStr: string): string {
  return DAY_ABBR[new Date(dateStr + 'T12:00:00Z').getUTCDay()] ?? ''
}

function dayNumber(dateStr: string): string {
  return String(parseInt(dateStr.split('-')[2] ?? '1', 10))
}

export default function WeekTracker({ entries }: WeekTrackerProps) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })
  const entryDates = new Set(entries.map(e => e.date))
  const days = Array.from({ length: 7 }, (_, i) => shiftDate(today, i - 6))

  return (
    <div>
      <p className="text-xs text-neutral-500 mb-2">Last 7 days</p>
      <div className="flex gap-1.5">
        {days.map(date => {
          const hasData = entryDates.has(date)
          const isToday = date === today

          if (hasData) {
            return (
              <div
                key={date}
                className="flex-1 flex flex-col items-center justify-center rounded-lg bg-green-50 border border-green-200 py-2 min-h-[44px]"
              >
                <span className="text-[11px] font-medium text-green-700 leading-tight">{dayAbbr(date)}</span>
                <span className="text-sm font-semibold text-green-800 leading-tight">{dayNumber(date)}</span>
                <span className="text-[10px] text-green-500 leading-none mt-0.5">✓</span>
              </div>
            )
          }

          if (isToday) {
            return (
              <Link
                key={date}
                href="/revenue/new"
                className="flex-1 flex flex-col items-center justify-center rounded-lg bg-sky-50 border border-sky-200 py-2 min-h-[44px] transition-colors hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
              >
                <span className="text-[11px] font-medium text-sky-700 leading-tight">{dayAbbr(date)}</span>
                <span className="text-sm font-semibold text-sky-800 leading-tight">{dayNumber(date)}</span>
                <span className="text-[10px] text-sky-400 leading-none mt-0.5">+</span>
              </Link>
            )
          }

          return (
            <Link
              key={date}
              href={`/revenue/new?date=${date}`}
              className="flex-1 flex flex-col items-center justify-center rounded-lg bg-red-50 border border-red-200 py-2 min-h-[44px] transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
            >
              <span className="text-[11px] font-medium text-red-700 leading-tight">{dayAbbr(date)}</span>
              <span className="text-sm font-semibold text-red-800 leading-tight">{dayNumber(date)}</span>
              <span className="text-[10px] text-red-400 leading-none mt-0.5">!</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
