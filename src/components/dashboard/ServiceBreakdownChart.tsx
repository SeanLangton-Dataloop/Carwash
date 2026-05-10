'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { formatZAR } from '@/lib/format'
import type { ServiceRevenue } from '@/lib/dashboard'

interface Props {
  data: ServiceRevenue[]
}

const BAR_COLOURS = [
  'var(--color-chart-revenue)',
  '#38bdf8',
  '#7dd3fc',
  '#bae6fd',
  '#e0f2fe',
]

function ServiceTooltip(props: TooltipContentProps): React.ReactNode {
  if (!props.active || !props.payload?.[0]) return null
  const d = props.payload[0].payload as ServiceRevenue
  return (
    <div className="rounded-lg bg-white border border-neutral-200 shadow-sm px-3 py-2 text-xs">
      <p className="font-semibold text-neutral-900">{d.service}</p>
      <p className="text-neutral-700">{formatZAR(d.revenue)}</p>
    </div>
  )
}

export default function ServiceBreakdownChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-neutral-400">
        No revenue data this month
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 44)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
      >
        <XAxis
          type="number"
          tickFormatter={(v: number) => formatZAR(v)}
          tick={{ fontSize: 10, fill: '#737373' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="service"
          tick={{ fontSize: 12, fill: '#404040' }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip content={ServiceTooltip} />
        <Bar dataKey="revenue" radius={[0, 3, 3, 0]} maxBarSize={28}>
          {data.map((_, i) => (
            <Cell key={i} fill={BAR_COLOURS[i % BAR_COLOURS.length] ?? '#0ea5e9'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
