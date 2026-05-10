'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createCost } from '../actions'

interface Props {
  initialDate: string
}

export default function NewCostForm({ initialDate }: Props) {
  const router = useRouter()
  const [date, setDate] = useState(initialDate)
  const [category, setCategory] = useState<'cos' | 'capex'>('cos')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [isSaving, startSave] = useTransition()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function handleSubmit() {
    setError('')

    if (!description.trim()) {
      setError('Description is required.')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Enter a valid amount greater than zero.')
      return
    }

    startSave(async () => {
      const result = await createCost({
        date,
        category,
        description: description.trim(),
        amount: amountNum,
        notes: notes.trim(),
      })

      if (result.error) {
        setError(result.error)
        return
      }

      showToast('Purchase saved')
      setTimeout(() => router.push('/costs'), 1200)
    })
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-6 space-y-6">

        <h1 className="text-xl font-semibold text-neutral-900">Log a Purchase</h1>

        <div className="rounded-xl bg-white shadow-sm border border-neutral-200">
          <div className="p-4 md:p-6 space-y-4">

            {/* Date */}
            <div>
              <label
                htmlFor="cost-date"
                className="block text-sm font-medium text-neutral-700"
              >
                Date
              </label>
              <div className="mt-1">
                <input
                  id="cost-date"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <p className="block text-sm font-medium text-neutral-700 mb-2">Category</p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                  <input
                    type="radio"
                    name="category"
                    value="cos"
                    checked={category === 'cos'}
                    onChange={() => setCategory('cos')}
                    className="h-4 w-4 accent-sky-500 focus:ring-sky-500"
                  />
                  <span className="text-sm text-neutral-900">
                    Cleaning / Consumables
                    <span className="ml-1 text-neutral-500">(Cost of Sales)</span>
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                  <input
                    type="radio"
                    name="category"
                    value="capex"
                    checked={category === 'capex'}
                    onChange={() => setCategory('capex')}
                    className="h-4 w-4 accent-sky-500 focus:ring-sky-500"
                  />
                  <span className="text-sm text-neutral-900">
                    Equipment
                    <span className="ml-1 text-neutral-500">(CapEx)</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="cost-desc"
                className="block text-sm font-medium text-neutral-700"
              >
                Description
              </label>
              <div className="mt-1">
                <input
                  id="cost-desc"
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Cleaning chemicals — Pick n Pay"
                  className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-neutral-700">Amount</label>
              <div className="mt-1 flex rounded-lg border border-neutral-300 focus-within:ring-2 focus-within:ring-sky-500">
                <span className="flex items-center rounded-l-lg bg-neutral-100 px-3 text-sm text-neutral-500 border-r border-neutral-300 select-none">
                  R
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="block w-full rounded-r-lg px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none bg-white"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="cost-notes"
                className="block text-sm font-medium text-neutral-700"
              >
                Notes{' '}
                <span className="font-normal text-neutral-400">(optional)</span>
              </label>
              <div className="mt-1">
                <textarea
                  id="cost-notes"
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any additional notes…"
                  className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
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
              Save purchase
            </button>
          </div>
        </div>
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
