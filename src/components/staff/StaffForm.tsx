'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createStaff, updateStaff, deactivateStaff } from '@/app/staff/actions'
import type { PayType } from '@/lib/types'

interface ExistingStaff {
  id: string
  full_name: string
  role: string
  pay_type: PayType
  daily_rate: number
  monthly_salary: number | null
  phone: string | null
  is_active: boolean
}

interface Props {
  existingStaff?: ExistingStaff
}

const ROLE_OPTIONS = [
  { value: 'washer', label: 'Washer' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'owner', label: 'Owner' },
]

export default function StaffForm({ existingStaff }: Props) {
  const router = useRouter()
  const isEdit = !!existingStaff

  const [fullName, setFullName] = useState(existingStaff?.full_name ?? '')
  const [role, setRole] = useState(existingStaff?.role ?? 'washer')
  const [payType, setPayType] = useState<PayType>(existingStaff?.pay_type ?? 'daily_rate')
  const [dailyRate, setDailyRate] = useState(
    existingStaff ? String(existingStaff.daily_rate) : ''
  )
  const [monthlySalary, setMonthlySalary] = useState(
    existingStaff?.monthly_salary != null ? String(existingStaff.monthly_salary) : ''
  )
  const [phone, setPhone] = useState(existingStaff?.phone ?? '')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [isSaving, startSave] = useTransition()
  const [isDeactivating, startDeactivate] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function handleSubmit() {
    setError('')

    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }

    let resolvedDailyRate = 0
    let resolvedMonthlySalary: number | null = null

    if (payType === 'daily_rate') {
      const rate = parseFloat(dailyRate)
      if (isNaN(rate) || rate <= 0) {
        setError('Enter a valid daily rate greater than zero.')
        return
      }
      resolvedDailyRate = rate
    } else {
      const salary = parseFloat(monthlySalary)
      if (isNaN(salary) || salary <= 0) {
        setError('Enter a valid monthly salary greater than zero.')
        return
      }
      resolvedMonthlySalary = salary
    }

    startSave(async () => {
      const params = {
        full_name: fullName.trim(),
        role,
        pay_type: payType,
        daily_rate: resolvedDailyRate,
        monthly_salary: resolvedMonthlySalary,
        phone: phone.trim(),
      }

      const result = isEdit
        ? await updateStaff(existingStaff.id, params)
        : await createStaff(params)

      if (result.error) {
        setError(result.error)
        return
      }

      if (isEdit) {
        showToast('Staff member updated')
      } else {
        showToast('Staff member added')
        setTimeout(() => router.push('/staff'), 1200)
      }
    })
  }

  function handleDeactivate() {
    if (!existingStaff) return
    startDeactivate(async () => {
      const result = await deactivateStaff(existingStaff.id)
      if (result.error) {
        setError(result.error)
        return
      }
      router.push('/staff')
    })
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-6 space-y-6">

        <h1 className="text-xl font-semibold text-neutral-900">
          {isEdit ? 'Edit Staff Member' : 'Add Staff Member'}
        </h1>

        {/* Inactive notice */}
        {isEdit && !existingStaff.is_active && (
          <div
            role="alert"
            className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-700"
          >
            This staff member is inactive and excluded from attendance and wage calculations.
          </div>
        )}

        {/* Form card */}
        <div className="rounded-xl bg-white shadow-sm border border-neutral-200">
          <div className="p-4 md:p-6 space-y-4">

            {/* Full name */}
            <div>
              <label
                htmlFor="staff-name"
                className="block text-sm font-medium text-neutral-700"
              >
                Full name
              </label>
              <div className="mt-1">
                <input
                  id="staff-name"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Sipho Dlamini"
                  className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="staff-role"
                className="block text-sm font-medium text-neutral-700"
              >
                Role
              </label>
              <div className="mt-1">
                <select
                  id="staff-role"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {ROLE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pay type */}
            <div>
              <p className="block text-sm font-medium text-neutral-700 mb-2">Pay type</p>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pay-type"
                    value="daily_rate"
                    checked={payType === 'daily_rate'}
                    onChange={() => setPayType('daily_rate')}
                    className="h-4 w-4 text-sky-500 border-neutral-300 focus:ring-sky-500"
                  />
                  <span className="text-sm text-neutral-700">Daily rate</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pay-type"
                    value="monthly_salary"
                    checked={payType === 'monthly_salary'}
                    onChange={() => setPayType('monthly_salary')}
                    className="h-4 w-4 text-sky-500 border-neutral-300 focus:ring-sky-500"
                  />
                  <span className="text-sm text-neutral-700">Monthly salary</span>
                </label>
              </div>
            </div>

            {/* Daily rate — shown when pay_type = 'daily_rate' */}
            {payType === 'daily_rate' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Daily rate
                </label>
                <div className="mt-1 flex rounded-lg border border-neutral-300 focus-within:ring-2 focus-within:ring-sky-500">
                  <span className="flex items-center rounded-l-lg bg-neutral-100 px-3 text-sm text-neutral-500 border-r border-neutral-300 select-none">
                    R
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={dailyRate}
                    onChange={e => setDailyRate(e.target.value)}
                    placeholder="0.00"
                    className="block w-full rounded-r-lg px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none bg-white"
                  />
                </div>
              </div>
            )}

            {/* Monthly salary — shown when pay_type = 'monthly_salary' */}
            {payType === 'monthly_salary' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Monthly salary
                </label>
                <div className="mt-1 flex rounded-lg border border-neutral-300 focus-within:ring-2 focus-within:ring-sky-500">
                  <span className="flex items-center rounded-l-lg bg-neutral-100 px-3 text-sm text-neutral-500 border-r border-neutral-300 select-none">
                    R
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={monthlySalary}
                    onChange={e => setMonthlySalary(e.target.value)}
                    placeholder="10 000.00"
                    className="block w-full rounded-r-lg px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none bg-white"
                  />
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  Fixed monthly amount, paid regardless of days worked.
                </p>
              </div>
            )}

            {/* Phone */}
            <div>
              <label
                htmlFor="staff-phone"
                className="block text-sm font-medium text-neutral-700"
              >
                Phone{' '}
                <span className="font-normal text-neutral-400">(optional — WhatsApp)</span>
              </label>
              <div className="mt-1">
                <input
                  id="staff-phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+27 82 123 4567"
                  className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
              {isEdit ? 'Save changes' : 'Add staff member'}
            </button>
          </div>
        </div>

        {/* Deactivate section — edit mode, active staff only */}
        {isEdit && existingStaff.is_active && (
          <div className="rounded-xl bg-white shadow-sm border border-neutral-200">
            <div className="p-4 md:p-6">
              <h2 className="text-base font-semibold text-neutral-900">Deactivate</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Removes this person from the active roster. Their wage history is preserved.
              </p>
              <div className="mt-4">
                {!showConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowConfirm(true)}
                    className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-h-[44px]"
                  >
                    Deactivate staff member
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-neutral-900">
                      Deactivate {existingStaff.full_name}? This cannot be undone via the app.
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleDeactivate}
                        disabled={isDeactivating}
                        className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 min-h-[44px]"
                      >
                        {isDeactivating && (
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        )}
                        Yes, deactivate
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConfirm(false)}
                        className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 min-h-[44px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
