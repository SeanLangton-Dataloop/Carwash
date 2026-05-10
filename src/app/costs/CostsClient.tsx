'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatZAR } from '@/lib/format'

interface CostEntry {
  id: string
  date: string
  description: string
  amount: number
  notes: string | null
}

interface Props {
  cosEntries: CostEntry[]
  capexEntries: CostEntry[]
  monthlyCos: number
  monthlyCapex: number
  monthLabel: string
}

function formatDate(dateStr: string): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  const parts = dateStr.split('-')
  const year = parts[0] ?? ''
  const month = parseInt(parts[1] ?? '1', 10)
  const day = parseInt(parts[2] ?? '1', 10)
  return `${day} ${months[month - 1] ?? ''} ${year}`
}

function CostList({ entries, emptyLabel }: { entries: CostEntry[]; emptyLabel: string }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-10 text-center">
        <p className="text-sm font-semibold text-neutral-900">No entries yet</p>
        <p className="mt-1 text-sm text-neutral-500">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-neutral-200 overflow-hidden">
      <ul className="divide-y divide-neutral-100 bg-white">
        {entries.map(entry => (
          <li key={entry.id} className="flex items-center justify-between px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">
                {entry.description}
              </p>
              <p className="text-xs text-neutral-500">{formatDate(entry.date)}</p>
              {entry.notes && (
                <p className="mt-0.5 text-xs text-neutral-400 truncate">{entry.notes}</p>
              )}
            </div>
            <span className="ml-4 shrink-0 text-sm font-semibold text-neutral-900">
              {formatZAR(entry.amount)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function CostsClient({
  cosEntries,
  capexEntries,
  monthlyCos,
  monthlyCapex,
  monthLabel,
}: Props) {
  const [tab, setTab] = useState<'cos' | 'capex'>('cos')

  const monthlyTotal = monthlyCos + monthlyCapex
  const activeEntries = tab === 'cos' ? cosEntries : capexEntries

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-neutral-900">Costs</h1>
          <Link
            href="/costs/new"
            className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-600 active:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 min-h-[44px]"
          >
            Log a purchase
          </Link>
        </div>

        {/* Monthly summary */}
        <div>
          <p className="mb-2 text-xs font-medium text-neutral-500 uppercase tracking-wide">
            {monthLabel}
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white shadow-sm border border-neutral-200 p-4">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Cost of Sales
              </p>
              <p className="mt-1 text-lg font-bold text-neutral-900">
                {formatZAR(monthlyCos)}
              </p>
            </div>
            <div className="rounded-xl bg-white shadow-sm border border-neutral-200 p-4">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                CapEx
              </p>
              <p className="mt-1 text-lg font-bold text-neutral-900">
                {formatZAR(monthlyCapex)}
              </p>
            </div>
            <div className="rounded-xl bg-white shadow-sm border border-neutral-200 p-4">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Combined
              </p>
              <p className="mt-1 text-lg font-bold text-neutral-900">
                {formatZAR(monthlyTotal)}
              </p>
            </div>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-lg border border-neutral-200 bg-neutral-50 p-1">
          <button
            type="button"
            onClick={() => setTab('cos')}
            className={`flex-1 rounded px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px] ${
              tab === 'cos'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Cost of Sales
          </button>
          <button
            type="button"
            onClick={() => setTab('capex')}
            className={`flex-1 rounded px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px] ${
              tab === 'capex'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Equipment (CapEx)
          </button>
        </div>

        {/* Monthly total for selected tab */}
        <div className="flex items-center justify-between rounded-lg bg-white border border-neutral-200 px-4 py-3">
          <span className="text-sm text-neutral-600">
            {tab === 'cos' ? 'Cost of Sales' : 'Equipment'} — {monthLabel}
          </span>
          <span className="text-sm font-semibold text-neutral-900">
            {formatZAR(tab === 'cos' ? monthlyCos : monthlyCapex)}
          </span>
        </div>

        {/* List */}
        <CostList
          entries={activeEntries}
          emptyLabel={
            tab === 'cos'
              ? 'Log your first consumable purchase above.'
              : 'Log your first equipment purchase above.'
          }
        />
      </div>
    </div>
  )
}
