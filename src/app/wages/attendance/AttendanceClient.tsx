'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveAttendance } from '@/app/wages/actions'
import { addDays, formatDisplayDate } from '@/lib/wages'

interface StaffMember {
  id: string
  full_name: string
  role: string
}

interface Props {
  date: string
  staff: StaffMember[]
  initialPresent: Record<string, boolean>
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  supervisor: 'Supervisor',
  washer: 'Washer',
}

export default function AttendanceClient({ date, staff, initialPresent }: Props) {
  const router = useRouter()
  const [present, setPresent] = useState<Record<string, boolean>>(initialPresent)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [isPending, startTransition] = useTransition()

  function toggle(id: string) {
    setPresent(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function handleSave() {
    setError('')
    startTransition(async () => {
      const records = staff.map(m => ({ staff_id: m.id, present: present[m.id] ?? false }))
      const result = await saveAttendance(date, records)
      if (result.error) {
        setError(result.error)
        return
      }
      showToast('Attendance saved')
    })
  }

  const presentCount = staff.filter(m => present[m.id]).length

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-6 space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-neutral-900">Attendance</h1>
        </div>

        {/* Date navigation */}
        <div className="flex items-center justify-between rounded-xl bg-white shadow-sm border border-neutral-200 px-4 py-3">
          <button
            type="button"
            onClick={() => router.push(`/wages/attendance?date=${addDays(date, -1)}`)}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
          >
            ← Prev
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-neutral-900">{formatDisplayDate(date)}</p>
            <p className="text-xs text-neutral-500">{presentCount} of {staff.length} present</p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/wages/attendance?date=${addDays(date, 1)}`)}
            className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
          >
            Next →
          </button>
        </div>

        {/* Staff list */}
        {staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
            <p className="text-sm font-semibold text-neutral-900">No active staff</p>
            <p className="mt-1 text-sm text-neutral-500">
              Add staff members to mark attendance.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-xl bg-white shadow-sm border border-neutral-200 overflow-hidden">
              <ul className="divide-y divide-neutral-100">
                {staff.map(member => {
                  const isPresent = present[member.id] ?? false
                  return (
                    <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900">{member.full_name}</p>
                        <p className="text-xs text-neutral-500">
                          {ROLE_LABEL[member.role] ?? member.role}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggle(member.id)}
                        className={`shrink-0 inline-flex items-center justify-center rounded-lg px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[36px] ${
                          isPresent
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'border border-neutral-300 bg-white text-neutral-500 hover:bg-neutral-50'
                        }`}
                      >
                        {isPresent ? 'Present' : 'Absent'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="w-full inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-600 active:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
            >
              {isPending && (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Save attendance
            </button>
          </>
        )}
      </div>

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
