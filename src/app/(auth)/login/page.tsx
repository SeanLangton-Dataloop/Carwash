'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from './actions'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <>
      <h2 className="mb-6 text-base font-semibold text-neutral-900">
        Sign in to your account
      </h2>

      <form action={action} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-neutral-700"
          >
            Email
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-neutral-700"
          >
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {state?.error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-600 active:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>

        <div className="text-center">
          <Link
            href="/reset-password"
            className="text-sm text-sky-600 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:rounded"
          >
            Forgot password?
          </Link>
        </div>
      </form>
    </>
  )
}
