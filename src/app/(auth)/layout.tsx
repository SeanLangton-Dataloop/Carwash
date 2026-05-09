export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 px-4">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-sky-600">Car Wash Manager</h1>
      </div>
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        {children}
      </div>
    </div>
  )
}
