'use client'

import dynamic from 'next/dynamic'
import { formatZAR } from '@/lib/format'
import type { DashboardStats, RevenueDay, ServiceRevenue, WeeklyMetrics } from '@/lib/dashboard'

const ChartSkeleton = () => (
  <div className="animate-pulse rounded bg-neutral-200 h-60 w-full" />
)

const SmallChartSkeleton = () => (
  <div className="animate-pulse rounded bg-neutral-200 h-48 w-full" />
)

const RevenueBarChart = dynamic(
  () => import('@/components/dashboard/RevenueBarChart'),
  { ssr: false, loading: ChartSkeleton },
)
const ServiceBreakdownChart = dynamic(
  () => import('@/components/dashboard/ServiceBreakdownChart'),
  { ssr: false, loading: SmallChartSkeleton },
)
const PaymentSplitChart = dynamic(
  () => import('@/components/dashboard/PaymentSplitChart'),
  { ssr: false, loading: SmallChartSkeleton },
)
const CostRevenueChart = dynamic(
  () => import('@/components/dashboard/CostRevenueChart'),
  { ssr: false, loading: SmallChartSkeleton },
)

interface Props {
  stats: DashboardStats
  revenueByDay: RevenueDay[]
  serviceRevenue: ServiceRevenue[]
  weeklyMetrics: WeeklyMetrics[]
  monthLabel: string
}

interface StatCardProps {
  label: string
  value: string
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-neutral-200 p-4">
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  )
}

export default function DashboardClient({
  stats,
  revenueByDay,
  serviceRevenue,
  weeklyMetrics,
  monthLabel,
}: Props) {
  const grossProfit =
    weeklyMetrics.reduce((s, w) => s + w.revenue, 0) -
    weeklyMetrics.reduce((s, w) => s + w.cos, 0)

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto max-w-4xl px-4 py-6 pb-24 md:pb-6 space-y-6">

        <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>

        {/* Section 1 — Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Today's revenue" value={formatZAR(stats.todayRevenue)} />
          <StatCard label="This week" value={formatZAR(stats.weekRevenue)} />
          <StatCard label={`${monthLabel} revenue`} value={formatZAR(stats.monthRevenue)} />
          <StatCard label={`${monthLabel} washes`} value={String(stats.monthWashCount)} />
        </div>

        {/* Section 2 — Revenue bar chart (last 30 days) */}
        <div className="rounded-xl bg-white shadow-sm border border-neutral-200 p-4 md:p-6">
          <h2 className="text-base font-semibold text-neutral-900 mb-4">
            Revenue — last 30 days
          </h2>
          <div className="flex items-center gap-4 mb-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
              Clear
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-400" />
              Cloudy
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-400" />
              Rain
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-800" />
              Storm
            </span>
          </div>
          <RevenueBarChart data={revenueByDay} />
        </div>

        {/* Section 3 — Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl bg-white shadow-sm border border-neutral-200 p-4 md:p-6">
            <h2 className="text-base font-semibold text-neutral-900 mb-4">
              Revenue by service — {monthLabel}
            </h2>
            <ServiceBreakdownChart data={serviceRevenue} />
          </div>
          <div className="rounded-xl bg-white shadow-sm border border-neutral-200 p-4 md:p-6">
            <h2 className="text-base font-semibold text-neutral-900 mb-4">
              Cash vs card — {monthLabel}
            </h2>
            <PaymentSplitChart
              cashTotal={stats.monthCashTotal}
              cardTotal={stats.monthCardTotal}
            />
          </div>
        </div>

        {/* Section 4 — Cost vs Revenue */}
        <div className="rounded-xl bg-white shadow-sm border border-neutral-200 p-4 md:p-6">
          <h2 className="text-base font-semibold text-neutral-900 mb-4">
            Revenue vs cost of sales — {monthLabel}
          </h2>
          <CostRevenueChart data={weeklyMetrics} grossProfit={grossProfit} />
        </div>

      </div>
    </div>
  )
}
