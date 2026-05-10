'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import type { LabelProps, CartesianViewBox, TooltipContentProps } from 'recharts'
import { formatZAR } from '@/lib/format'
import type { RevenueDay } from '@/lib/dashboard'

interface Props {
  data: RevenueDay[]
}

function getWeatherColor(code: number | null): string | null {
  if (code === null) return null
  if (code <= 1) return 'var(--color-weather-clear)'
  if (code <= 3) return 'var(--color-weather-cloud)'
  if (code >= 95) return 'var(--color-weather-storm)'
  if (code >= 51) return 'var(--color-weather-rain)'
  if (code >= 45) return 'var(--color-weather-cloud)'
  return 'var(--color-weather-cloud)'
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`
}

function renderWeatherDot(props: LabelProps): React.ReactElement {
  const vb = props.viewBox as CartesianViewBox | undefined
  const x = vb?.x ?? 0
  const y = vb?.y ?? 0
  const width = vb?.width ?? 0
  const code = typeof props.value === 'number' ? props.value : null
  const color = getWeatherColor(code)
  if (!color) return <g />
  return <circle cx={x + width / 2} cy={y - 7} r={4} fill={color} />
}

function WeatherTooltip(props: TooltipContentProps): React.ReactNode {
  if (!props.active || !props.payload?.[0]) return null
  const d = props.payload[0].payload as RevenueDay
  return (
    <div className="rounded-lg bg-white border border-neutral-200 shadow-sm px-3 py-2 text-xs max-w-[180px]">
      <p className="font-semibold text-neutral-900">{d.date}</p>
      <p className="text-neutral-700">Revenue: {formatZAR(d.revenue)}</p>
      {d.weatherLabel && (
        <p className="text-neutral-500">
          {d.weatherLabel}
          {d.tempMaxC != null ? ` · ${d.tempMaxC}°C` : ''}
        </p>
      )}
    </div>
  )
}

export default function RevenueBarChart({ data }: Props) {
  const hasData = data.some(d => d.revenue > 0)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-60 text-sm text-neutral-400">
        No revenue recorded in this period
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 20, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={shortDate}
          tick={{ fontSize: 10, fill: '#737373' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v: number) => formatZAR(v)}
          tick={{ fontSize: 10, fill: '#737373' }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip content={WeatherTooltip} />
        <Bar dataKey="revenue" fill="var(--color-chart-revenue)" radius={[3, 3, 0, 0]} maxBarSize={32}>
          <LabelList dataKey="weatherCode" content={renderWeatherDot} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
