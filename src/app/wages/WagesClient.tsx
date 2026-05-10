'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatZAR } from '@/lib/format'
import { addDays, formatDisplayDate } from '@/lib/wages'
import type { WageSummary } from '@/lib/wages'

interface Props {
  weekStart: string
  weekEnd: string
  summaries: WageSummary[]
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  supervisor: 'Supervisor',
  washer: 'Washer',
}

export default function WagesClient({ weekStart, weekEnd, summaries }: Props) {
  const router = useRouter()

  const totalWages = summaries.reduce((sum, s) => sum + s.totalWage, 0)
  const totalDays = summaries.reduce((sum, s) => sum + s.daysWorked, 0)
  const hasSalaried = summaries.some(s => s.payType === 'monthly_salary')

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-neutral-900">Wages</h1>
          <Link
            href="/wages/attendance"
            className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-600 active:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 min-h-[44px]"
          >
            Mark attendance
          </Link>
        </div>

        {/* Week navigation */}
        <div className="flex items-center justify-between rounded-xl bg-white shadow-sm border border-neutral-200 px-4 py-3">
          <button
            type="button"
            onClick={() => router.push(`/wages?week=${addDays(weekStart, -7)}`)}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
          >
            ← Prev
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-neutral-900">
              {formatDisplayDate(weekStart)} – {formatDisplayDate(weekEnd)}
            </p>
            <p className="text-xs text-neutral-500">Mon – Sun</p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/wages?week=${addDays(weekStart, 7)}`)}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
          >
            Next →
          </button>
        </div>

        {/* Wage table */}
        {summaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
            <p className="text-sm font-semibold text-neutral-900">No active staff</p>
            <p className="mt-1 text-sm text-neutral-500">
              Add staff members to view wage summaries.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-xl bg-white shadow-sm border border-neutral-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-xs text-neutral-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">Rate</th>
                    <th className="px-4 py-3 text-right font-medium">Days</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {summaries.map(s => {
                    const isSalaried = s.payType === 'monthly_salary'
                    return (
                      <tr
                        key={s.staffId}
                        className={s.daysWorked === 0 && !isSalaried ? 'opacity-50' : ''}
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="font-medium text-neutral-900">{s.name}</p>
                            {isSalaried && (
                              <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                                Salaried
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500">
                            {ROLE_LABEL[s.role] ?? s.role}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-600 hidden sm:table-cell">
                          {isSalaried ? (
                            <>
                              {formatZAR(s.monthlySalary)}
                              <span className="text-xs text-neutral-400"> /mo</span>
                            </>
                          ) : (
                            <>
                              {formatZAR(s.dailyRate)}
                              <span className="text-xs text-neutral-400"> /day</span>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-neutral-700">
                          {s.daysWorked}
                          {isSalaried && (
                            <span className="text-xs text-neutral-400">*</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-neutral-900">
                          {formatZAR(s.totalWage)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-neutral-200 bg-neutral-50">
                    <td className="px-4 py-3 font-semibold text-neutral-900">Total</td>
                    <td className="px-4 py-3 hidden sm:table-cell" />
                    <td className="px-4 py-3 text-right font-semibold text-neutral-900">
                      {totalDays}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-neutral-900">
                      {formatZAR(totalWages)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {hasSalaried && (
              <p className="text-xs text-neutral-500 px-1">
                * Salaried staff wages show full monthly salary regardless of days worked.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
