'use client'

import { useState, useEffect } from 'react'
import type { DailyWeather } from '@/lib/weather'

interface UseWeatherResult {
  weather: DailyWeather[]
  isLoading: boolean
  error: string | null
}

export function useWeather(start: string, end: string): UseWeatherResult {
  const [weather, setWeather] = useState<DailyWeather[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!start || !end) return

    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetch(`/api/weather/daily?start=${start}&end=${end}`)
      .then(res => {
        if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`)
        return res.json() as Promise<{ weather: DailyWeather[] }>
      })
      .then(data => {
        if (!cancelled) {
          setWeather(data.weather)
          setIsLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load weather')
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [start, end])

  return { weather, isLoading, error }
}
