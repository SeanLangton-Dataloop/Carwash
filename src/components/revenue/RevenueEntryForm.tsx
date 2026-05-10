'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createDailyRevenue, updateDailyRevenue } from '@/app/revenue/actions'
import { formatZAR } from '@/lib/format'
import type { ServiceType, VehicleType, PriceMatrix } from '@/lib/types'

interface ExistingEntry {
  id: string
  date: string
  cash_total: number
  card_total: number
  notes: string | null
  lineItems: Array<{
    service_type: string
    vehicle_type: string
    quantity: number
    unit_price: number
  }>
}

interface Props {
  serviceTypes: ServiceType[]
  vehicleTypes: VehicleType[]
  priceMatrix: PriceMatrix
  initialDate: string
  existingEntry?: ExistingEntry
}

interface CellState {
  quantity: string
  unitPrice: string
}

function buildInitialMatrix(
  serviceTypes: ServiceType[],
  vehicleTypes: VehicleType[],
  priceMatrix: PriceMatrix,
  existingEntry?: ExistingEntry
): Record<string, CellState> {
  const m: Record<string, CellState> = {}
  for (const s of serviceTypes) {
    for (const v of vehicleTypes) {
      const key = `${s.name}|${v.name}`
      const existing = existingEntry?.lineItems.find(
        li => li.service_type === s.name && li.vehicle_type === v.name
      )
      if (existing) {
        m[key] = { quantity: String(existing.quantity), unitPrice: String(existing.unit_price) }
      } else {
        const price = priceMatrix[key]
        m[key] = { quantity: '', unitPrice: price != null ? String(price) : '' }
      }
    }
  }
  return m
}

export default function RevenueEntryForm({
  serviceTypes,
  vehicleTypes,
  priceMatrix,
  initialDate,
  existingEntry,
}: Props) {
  const router = useRouter()
  const isEditMode = !!existingEntry

  const [date, setDate] = useState(existingEntry?.date ?? initialDate)
  const [matrix, setMatrix] = useState<Record<string, CellState>>(() =>
    buildInitialMatrix(serviceTypes, vehicleTypes, priceMatrix, existingEntry)
  )
  const [cashTotal, setCashTotal] = useState(
    existingEntry ? String(existingEntry.cash_total) : ''
  )
  const [cardTotal, setCardTotal] = useState(
    existingEntry ? String(existingEntry.card_total) : ''
  )
  const [notes, setNotes] = useState(existingEntry?.notes ?? '')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [isSaving, startSave] = useTransition()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function getQty(service: string, vehicle: string): number {
    const val = parseInt(matrix[`${service}|${vehicle}`]?.quantity ?? '0', 10)
    return isNaN(val) || val < 0 ? 0 : val
  }

  function getPrice(service: string, vehicle: string): number {
    const val = parseFloat(matrix[`${service}|${vehicle}`]?.unitPrice ?? '0')
    return isNaN(val) || val < 0 ? 0 : val
  }

  function rowTotal(service: string): number {
    return vehicleTypes.reduce(
      (sum, v) => sum + getQty(service, v.name) * getPrice(service, v.name),
      0
    )
  }

  const grandTotal = serviceTypes.reduce((sum, s) => sum + rowTotal(s.name), 0)
  const cashNum = parseFloat(cashTotal) || 0
  const cardNum = parseFloat(cardTotal) || 0
  const paymentTotal = cashNum + cardNum
  const paymentMismatch =
    (cashNum > 0 || cardNum > 0) && Math.abs(paymentTotal - grandTotal) > 0.01

  function updateCell(
    service: string,
    vehicle: string,
    field: 'quantity' | 'unitPrice',
    value: string
  ) {
    const key = `${service}|${vehicle}`
    setMatrix(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? { quantity: '', unitPrice: '' }), [field]: value },
    }))
  }

  function handleSubmit() {
    setError('')

    const lineItems = serviceTypes.flatMap(s =>
      vehicleTypes
        .map(v => ({
          service_type: s.name,
          vehicle_type: v.name,
          quantity: getQty(s.name, v.name),
          unit_price: getPrice(s.name, v.name),
        }))
        .filter(li => li.quantity > 0)
    )

    if (lineItems.length === 0) {
      setError('Enter at least one quantity greater than zero.')
      return
    }

    startSave(async () => {
      const params = {
        date,
        lineItems,
        cashTotal: cashNum,
        cardTotal: cardNum,
        notes: notes.trim(),
      }

      const result = isEditMode
        ? await updateDailyRevenue(existingEntry.id, params)
        : await createDailyRevenue(params)

      if (result.error) {
        setError(result.error)
        return
      }

      if (isEditMode) {
        showToast('Entry updated')
      } else {
        showToast("Revenue saved")
        setTimeout(() => router.push('/revenue'), 1200)
      }
    })
  }

  if (serviceTypes.length === 0 || vehicleTypes.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-100">
        <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-6">
          <h1 className="text-xl font-semibold text-neutral-900 mb-6">
            {isEditMode ? 'Edit Revenue Entry' : "Log Today's Revenue"}
          </h1>
          <div className="rounded-xl bg-white shadow-sm border border-neutral-200 p-6">
            <p className="text-sm text-neutral-500">
              No active service or vehicle types found. Configure them in{' '}
              <a href="/settings" className="text-sky-600 hover:underline">
                Settings
              </a>{' '}
              before logging revenue.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-6 space-y-6">

        {/* Header */}
        <h1 className="text-xl font-semibold text-neutral-900">
          {isEditMode ? 'Edit Revenue Entry' : "Log Today's Revenue"}
        </h1>

        {/* Date */}
        <div className="rounded-xl bg-white shadow-sm border border-neutral-200">
          <div className="p-4 md:p-6">
            <label
              htmlFor="entry-date"
              className="block text-sm font-medium text-neutral-700"
            >
              Date
            </label>
            <div className="mt-1">
              <input
                id="entry-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                disabled={isEditMode}
                className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
              />
            </div>
            {!isEditMode && (
              <p className="mt-1 text-xs text-neutral-500">
                Change only for catch-up entries — defaults to today.
              </p>
            )}
          </div>
        </div>

        {/* Revenue Matrix */}
        <div className="rounded-xl bg-white shadow-sm border border-neutral-200">
          <div className="p-4 md:p-6">
            <h2 className="text-base font-semibold text-neutral-900 mb-4">
              Revenue Line Items
            </h2>
            <p className="mb-4 text-xs text-neutral-500">
              Top field: quantity. Bottom field: price per wash (R).
            </p>

            <div className="overflow-x-auto -mx-4 px-4">
              <table className="min-w-[500px] w-full">
                <thead>
                  <tr>
                    <th className="pb-3 pr-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      Service
                    </th>
                    {vehicleTypes.map(v => (
                      <th
                        key={v.name}
                        className="pb-3 px-2 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {v.name}
                      </th>
                    ))}
                    <th className="pb-3 pl-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide whitespace-nowrap">
                      Row Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {serviceTypes.map(s => (
                    <tr key={s.name}>
                      <td className="py-4 pr-4 text-sm font-medium text-neutral-900 whitespace-nowrap align-top">
                        {s.name}
                      </td>
                      {vehicleTypes.map(v => {
                        const key = `${s.name}|${v.name}`
                        return (
                          <td key={v.name} className="py-3 px-2 align-top">
                            <div className="flex flex-col gap-1.5">
                              {/* Quantity */}
                              <input
                                type="text"
                                inputMode="numeric"
                                value={matrix[key]?.quantity ?? ''}
                                onChange={e =>
                                  updateCell(s.name, v.name, 'quantity', e.target.value)
                                }
                                placeholder="0"
                                aria-label={`${s.name} / ${v.name} quantity`}
                                className="w-16 rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-base text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
                              />
                              {/* Unit price */}
                              <div className="flex w-16 overflow-hidden rounded border border-neutral-200 focus-within:ring-1 focus-within:ring-sky-400">
                                <span className="flex shrink-0 items-center bg-neutral-50 px-1 text-xs text-neutral-400 border-r border-neutral-200 select-none">
                                  R
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={matrix[key]?.unitPrice ?? ''}
                                  onChange={e =>
                                    updateCell(s.name, v.name, 'unitPrice', e.target.value)
                                  }
                                  placeholder="0"
                                  aria-label={`${s.name} / ${v.name} unit price`}
                                  className="min-w-0 flex-1 bg-white px-1 py-1 text-base text-neutral-600 focus:outline-none"
                                />
                              </div>
                            </div>
                          </td>
                        )
                      })}
                      <td className="py-4 pl-4 text-sm font-semibold text-neutral-900 text-right whitespace-nowrap align-top">
                        {formatZAR(rowTotal(s.name))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-neutral-200">
                    <td
                      colSpan={vehicleTypes.length + 1}
                      className="pt-3 pr-4 text-sm font-semibold text-neutral-700"
                    >
                      Grand Total
                    </td>
                    <td className="pt-3 pl-4 text-right whitespace-nowrap">
                      <span className="text-lg font-bold text-neutral-900">
                        {formatZAR(grandTotal)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Payment Split */}
        <div className="rounded-xl bg-white shadow-sm border border-neutral-200">
          <div className="p-4 md:p-6 space-y-4">
            <h2 className="text-base font-semibold text-neutral-900">Payment Split</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Cash received
                </label>
                <div className="mt-1 flex rounded-lg border border-neutral-300 focus-within:ring-2 focus-within:ring-sky-500">
                  <span className="flex items-center rounded-l-lg bg-neutral-100 px-3 text-sm text-neutral-500 border-r border-neutral-300 select-none">
                    R
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={cashTotal}
                    onChange={e => setCashTotal(e.target.value)}
                    placeholder="0.00"
                    className="block w-full rounded-r-lg px-3 py-2.5 text-base text-neutral-900 focus:outline-none bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Card received
                </label>
                <div className="mt-1 flex rounded-lg border border-neutral-300 focus-within:ring-2 focus-within:ring-sky-500">
                  <span className="flex items-center rounded-l-lg bg-neutral-100 px-3 text-sm text-neutral-500 border-r border-neutral-300 select-none">
                    R
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={cardTotal}
                    onChange={e => setCardTotal(e.target.value)}
                    placeholder="0.00"
                    className="block w-full rounded-r-lg px-3 py-2.5 text-base text-neutral-900 focus:outline-none bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3">
              <span className="text-sm text-neutral-600">Payment total</span>
              <span className="text-sm font-semibold text-neutral-900">
                {formatZAR(paymentTotal)}
              </span>
            </div>

            {paymentMismatch && (
              <div
                role="alert"
                className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700"
              >
                Payment total ({formatZAR(paymentTotal)}) does not match revenue total (
                {formatZAR(grandTotal)}). Double-check cash and card amounts.
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl bg-white shadow-sm border border-neutral-200">
          <div className="p-4 md:p-6">
            <label
              htmlFor="entry-notes"
              className="block text-sm font-medium text-neutral-700"
            >
              Notes{' '}
              <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            <div className="mt-1">
              <textarea
                id="entry-notes"
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any notes for this day…"
                className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="w-full inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-600 active:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
        >
          {isSaving && (
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          {isEditMode ? 'Update entry' : "Save day's revenue"}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white shadow-lg md:bottom-6"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
