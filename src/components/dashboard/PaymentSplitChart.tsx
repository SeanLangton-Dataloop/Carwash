'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { formatZAR } from '@/lib/format'

interface Props {
  cashTotal: number
  cardTotal: number
}

interface PieEntry {
  name: string
  value: number
  color: string
}

function SplitTooltip(props: TooltipContentProps): React.ReactNode {
  if (!props.active || !props.payload?.[0]) return null
  const d = props.payload[0].payload as PieEntry
  const total = props.payload.reduce((s, p) => s + ((p.payload as PieEntry).value), 0)
  const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
  return (
    <div className="rounded-lg bg-white border border-neutral-200 shadow-sm px-3 py-2 text-xs">
      <p className="font-semibold text-neutral-900">{d.name}</p>
      <p className="text-neutral-700">{formatZAR(d.value)} · {pct}%</p>
    </div>
  )
}

export default function PaymentSplitChart({ cashTotal, cardTotal }: Props) {
  const total = cashTotal + cardTotal

  const allSegments: PieEntry[] = [
    { name: 'Cash', value: cashTotal, color: 'var(--color-chart-cash)' },
    { name: 'Card', value: cardTotal, color: 'var(--color-chart-card)' },
  ]
  const pieData = allSegments.filter(d => d.value > 0)

  if (pieData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-neutral-400">
        No payment data this month
      </div>
    )
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            dataKey="value"
            paddingAngle={2}
          >
            {pieData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={SplitTooltip} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex justify-center gap-6">
        {allSegments
          .filter(s => s.value > 0)
          .map(s => {
            const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
            return (
              <div key={s.name} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: s.color }}
                />
                <span className="text-xs text-neutral-600">
                  {s.name} {pct}%
                </span>
              </div>
            )
          })}
      </div>
    </div>
  )
}
