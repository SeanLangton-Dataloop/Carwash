import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import './globals.css'

export const metadata: Metadata = {
  title: 'Car Wash Manager',
  description: 'Daily operations management for car wash owners',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
