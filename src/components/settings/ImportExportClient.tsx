'use client'

import { useState } from 'react'
import Link from 'next/link'
import ImportPanel from './ImportPanel'

type Tab = 'revenue' | 'costs'

export default function ImportExportClient() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('revenue')

  function buildExportUrl(type: Tab): string {
    const params = new URLSearchParams()
    if (startDate) params.set('start', startDate)
    if (endDate) params.set('end', endDate)
    const qs = params.toString()
    return `/api/export/${type}${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="text-sm text-sky-600 hover:text-sky-700 focus:outline-none focus:underline"
          >
            ← Settings
          </Link>
          <h1 className="text-xl font-semibold text-neutral-900">Import / Export</h1>
        </div>

        {/* Section A — Export */}
        <div className="rounded-xl bg-white shadow-sm border border-neutral-200 p-4 md:p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Export Data</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Download your revenue and cost records as CSV files.
            </p>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="export-start"
                className="block text-xs font-medium text-neutral-600 mb-1"
              >
                From <span className="font-normal text-neutral-400">(optional)</span>
              </label>
              <input
                id="export-start"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label
                htmlFor="export-end"
                className="block text-xs font-medium text-neutral-600 mb-1"
              >
                To <span className="font-normal text-neutral-400">(optional)</span>
              </label>
              <input
                id="export-end"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={buildExportUrl('revenue')}
              className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-600 active:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 min-h-[44px]"
            >
              Export Revenue (CSV)
            </a>
            <a
              href={buildExportUrl('costs')}
              className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 active:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 min-h-[44px]"
            >
              Export Costs (CSV)
            </a>
          </div>
        </div>

        {/* Section B — Import */}
        <div className="rounded-xl bg-white shadow-sm border border-neutral-200 p-4 md:p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Import Historical Data</h2>
          </div>

          {/* Warning */}
          <div
            role="alert"
            className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800"
          >
            <strong>Import will add new records only.</strong> It will not overwrite existing
            entries. Days that already have revenue data will be skipped.
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-neutral-200 -mb-4">
            {(['revenue', 'costs'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-inset capitalize min-h-[44px] ${
                  activeTab === tab
                    ? 'text-sky-600 border-b-2 border-sky-500 -mb-px'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {tab === 'revenue' ? 'Revenue' : 'Costs'}
              </button>
            ))}
          </div>

          <div className="pt-4">
            {activeTab === 'revenue' && (
              <ImportPanel
                type="revenue"
                templateHref="/api/import/revenue-template"
                importHref="/api/import/revenue"
              />
            )}
            {activeTab === 'costs' && (
              <ImportPanel
                type="costs"
                templateHref="/api/import/costs-template"
                importHref="/api/import/costs"
              />
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
