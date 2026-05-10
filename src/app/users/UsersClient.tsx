'use client'

import { useState, useTransition } from 'react'

interface SiteUser {
  id: string
  full_name: string | null
  email: string | null
  role: string
  created_at: string
}

interface Props {
  users: SiteUser[]
  currentUserId: string
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
}

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-sky-50 text-sky-700',
  manager: 'bg-neutral-100 text-neutral-700',
}

function formatDate(dateStr: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const d = new Date(dateStr)
  return `${d.getDate()} ${months[d.getMonth()] ?? ''} ${d.getFullYear()}`
}

export default function UsersClient({ users, currentUserId }: Props) {
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [email, setEmail] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [toast, setToast] = useState('')
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState('')
  const [localUsers, setLocalUsers] = useState<SiteUser[]>(users)
  const [isInviting, startInvite] = useTransition()
  const [isRemoving, startRemove] = useTransition()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function handleInvite() {
    if (!email.trim()) {
      setInviteError('Email is required.')
      return
    }
    if (!email.includes('@')) {
      setInviteError('Enter a valid email address.')
      return
    }
    setInviteError('')
    startInvite(async () => {
      const res = await fetch('/api/admin/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok || json.error) {
        setInviteError(json.error ?? 'Invite failed')
        return
      }
      setEmail('')
      setShowInviteForm(false)
      showToast('Invite sent')
    })
  }

  function handleRemove(userId: string) {
    setRemoveError('')
    startRemove(async () => {
      const res = await fetch('/api/admin/remove-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok || json.error) {
        setRemoveError(json.error ?? 'Remove failed')
        setRemoveConfirm(null)
        return
      }
      setLocalUsers(prev => prev.filter(u => u.id !== userId))
      setRemoveConfirm(null)
    })
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-neutral-900">Users</h1>
          <button
            type="button"
            onClick={() => {
              setShowInviteForm(v => !v)
              setInviteError('')
              setEmail('')
            }}
            className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-600 active:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 min-h-[44px]"
          >
            {showInviteForm ? 'Cancel' : 'Invite user'}
          </button>
        </div>

        {/* Invite form */}
        {showInviteForm && (
          <div className="rounded-xl bg-white shadow-sm border border-neutral-200">
            <div className="p-4 md:p-6 space-y-4">
              <h2 className="text-base font-semibold text-neutral-900">Invite a user</h2>
              <div>
                <label htmlFor="invite-email" className="block text-sm font-medium text-neutral-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
              <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3">
                <p className="text-sm font-medium text-neutral-700">Role: Manager</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Can log revenue and mark attendance. Cannot manage settings or users.
                </p>
              </div>
              {inviteError && (
                <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {inviteError}
                </div>
              )}
              <button
                type="button"
                onClick={handleInvite}
                disabled={isInviting}
                className="w-full inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-600 active:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
              >
                {isInviting && (
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                Send invite
              </button>
            </div>
          </div>
        )}

        {/* Remove error */}
        {removeError && (
          <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {removeError}
          </div>
        )}

        {/* User list */}
        {localUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
            <p className="text-sm font-semibold text-neutral-900">No other users</p>
            <p className="mt-1 text-sm text-neutral-500">
              Invite a team member to give them access.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-white shadow-sm border border-neutral-200 overflow-hidden">
            <ul className="divide-y divide-neutral-100">
              {localUsers.map(u => (
                <li key={u.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-neutral-900">
                          {u.full_name ?? '—'}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            ROLE_BADGE[u.role] ?? 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {ROLE_LABEL[u.role] ?? u.role}
                        </span>
                        {u.id === currentUserId && (
                          <span className="text-xs text-neutral-400">(you)</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-neutral-500">{u.email ?? '—'}</p>
                      <p className="mt-0.5 text-xs text-neutral-400">
                        Joined {formatDate(u.created_at)}
                      </p>
                    </div>
                    {u.id !== currentUserId && (
                      <div className="shrink-0">
                        {removeConfirm === u.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRemove(u.id)}
                              disabled={isRemoving}
                              className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 min-h-[44px]"
                            >
                              {isRemoving && (
                                <span className="mr-1.5 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              )}
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setRemoveConfirm(null)}
                              className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRemoveConfirm(u.id)}
                            className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
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
