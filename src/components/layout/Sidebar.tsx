'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Tables } from '@/lib/database.types'

type SidebarProfile = Pick<Tables<'profiles'>, 'full_name' | 'email' | 'role'>

function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function IconRevenue() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-8 4 4 4-6" />
    </svg>
  )
}

function IconCosts() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  )
}

function IconWages() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  )
}

function IconStaff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

type NavLink = {
  label: string
  href: string
  Icon: () => React.JSX.Element
  adminOnly?: boolean
}

const navLinks: NavLink[] = [
  { label: 'Dashboard', href: '/dashboard', Icon: IconDashboard },
  { label: 'Revenue', href: '/revenue', Icon: IconRevenue },
  { label: 'Costs', href: '/costs', Icon: IconCosts },
  { label: 'Wages', href: '/wages', Icon: IconWages },
  { label: 'Staff', href: '/staff', Icon: IconStaff },
  { label: 'Settings', href: '/settings', Icon: IconSettings },
  { label: 'Users', href: '/users', Icon: IconUsers, adminOnly: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const [profile, setProfile] = useState<SidebarProfile | null>(null)

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return

    let cancelled = false

    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, role')
        .eq('id', user.id)
        .single()

      if (!cancelled && data) setProfile(data)
    }

    void fetchProfile()
    return () => { cancelled = true }
  }, [])

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="flex h-full flex-col border-r border-neutral-200 bg-white">
      {/* App name */}
      <div className="flex h-16 shrink-0 items-center border-b border-neutral-200 px-4">
        <span className="text-lg font-bold text-sky-600">Car Wash</span>
        <span className="ml-1 text-lg font-bold text-neutral-900">Manager</span>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navLinks.map((link) => {
          if (link.adminOnly && !isAdmin) return null

          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`)

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                focus:outline-none focus:ring-2 focus:ring-sky-500
                ${isActive
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-neutral-600 hover:bg-neutral-100'
                }`}
            >
              <link.Icon />
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* User info at bottom */}
      <div className="shrink-0 border-t border-neutral-200 p-4">
        {profile ? (
          <div>
            <p className="truncate text-sm font-medium text-neutral-900">
              {profile.full_name ?? profile.email ?? 'User'}
            </p>
            <p className="mt-0.5 text-xs capitalize text-neutral-500">
              {profile.role}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 animate-pulse rounded bg-neutral-200" />
            <div className="h-3 w-16 animate-pulse rounded bg-neutral-200" />
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
