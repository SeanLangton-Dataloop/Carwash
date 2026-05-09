import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Car Wash Manager',
  description: 'Daily operations management for car wash owners',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
