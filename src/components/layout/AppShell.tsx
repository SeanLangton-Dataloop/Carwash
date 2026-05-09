'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/reset-password'

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-[240px] md:flex-col">
        <Sidebar />
      </div>

      {/* Main content — offset by sidebar on desktop */}
      <main className="min-h-screen bg-neutral-100 md:pl-[240px]">
        {children}
      </main>

      {/* Bottom nav — hidden on desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <BottomNav />
      </div>
    </>
  )
}

export default AppShell
