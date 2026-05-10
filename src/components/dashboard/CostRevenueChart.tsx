'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { formatZAR } from '@/lib/format'
import type { WeeklyMetrics } from '@/lib/dashboard'

interface Props {
  data: WeeklyMetrics[]
  grossProfit: number
}

function CostTooltip(props: TooltipContentProps): React.ReactNode {
  if (!props.active || !props.payload) return null
  return (
    <div className="rounded-lg bg-white border border-neutral-200 shadow-sm px-3 py-2 text-xs">
      <p className="font-semibold text-neutral-900 mb-1">{props.label}</p>
      {props.payload.map((p, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {String(p.name)}: {formatZAR(typeof p.value === 'number' ? p.value : 0)}
        </p>
      ))}
    </div>
  )
}

export default function CostRevenueChart({ data, grossProfit }: Props) {
  const hasData = data.some(d => d.revenue > 0 || d.cos > 0)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-neutral-400">
        No data this month
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 12, fill: '#737373' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => formatZAR(v)}
            tick={{ fontSize: 10, fill: '#737373' }}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip content={CostTooltip} />
          <Legend
            formatter={(value: string) => (
              <span className="text-xs text-neutral-600">{value}</span>
            )}
          />
          <Bar dataKey="revenue" name="Revenue" fill="var(--color-chart-revenue)" radius={[3, 3, 0, 0]} maxBarSize={28} />
          <Bar dataKey="cos" name="Cost of Sales" fill="var(--color-chart-cos)" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-4 py-3">
        <span className="text-sm font-medium text-green-800">Gross profit this month</span>
        <span className={`text-sm font-bold ${grossProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
          {formatZAR(grossProfit)}
        </span>
      </div>
    </div>
  )
}
