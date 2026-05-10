'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatZAR } from '@/lib/format'

interface StaffMember {
  id: string
  full_name: string
  role: string
  daily_rate: number
  phone: string | null
  is_active: boolean
}

interface Props {
  staff: StaffMember[]
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  supervisor: 'Supervisor',
  washer: 'Washer',
}

const ROLE_BADGE: Record<string, string> = {
  owner: 'bg-sky-50 text-sky-700',
  supervisor: 'bg-amber-50 text-amber-700',
  washer: 'bg-neutral-100 text-neutral-700',
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        ROLE_BADGE[role] ?? 'bg-neutral-100 text-neutral-700'
      }`}
    >
      {ROLE_LABEL[role] ?? role}
    </span>
  )
}

export default function StaffClient({ staff }: Props) {
  const [showInactive, setShowInactive] = useState(false)

  const active = staff.filter(s => s.is_active)
  const inactive = staff.filter(s => !s.is_active)
  const displayed = showInactive ? staff : active

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-neutral-900">Staff</h1>
          <Link
            href="/staff/new"
            className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-600 active:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 min-h-[44px]"
          >
            Add staff member
          </Link>
        </div>

        {/* Empty state */}
        {active.length === 0 && !showInactive ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
            <p className="text-sm font-semibold text-neutral-900">No staff members yet</p>
            <p className="mt-1 text-sm text-neutral-500">
              Add your first staff member to track attendance and wages.
            </p>
            <div className="mt-4">
              <Link
                href="/staff/new"
                className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 min-h-[44px]"
              >
                Add staff member
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-white shadow-sm border border-neutral-200 overflow-hidden">
            <ul className="divide-y divide-neutral-100">
              {displayed.map(member => (
                <li
                  key={member.id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    !member.is_active ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-neutral-900">
                        {member.full_name}
                      </p>
                      <RoleBadge role={member.role} />
                      {!member.is_active && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-500">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-neutral-500">
                      <span>{formatZAR(member.daily_rate)}/day</span>
                      {member.phone && <span>{member.phone}</span>}
                    </div>
                  </div>
                  <Link
                    href={`/staff/${member.id}`}
                    className="shrink-0 inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[36px]"
                  >
                    Edit
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Show/hide inactive toggle */}
        {inactive.length > 0 && (
          <button
            type="button"
            onClick={() => setShowInactive(v => !v)}
            className="text-sm text-neutral-500 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-sky-500 rounded"
          >
            {showInactive
              ? `Hide inactive (${inactive.length})`
              : `Show inactive (${inactive.length})`}
          </button>
        )}
      </div>
    </div>
  )
}
