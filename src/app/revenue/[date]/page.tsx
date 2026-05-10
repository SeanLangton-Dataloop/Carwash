import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { getServiceTypes, getVehicleTypes, getPriceMatrix } from '@/lib/config'
import { formatZAR } from '@/lib/format'
import RevenueEntryForm from '@/components/revenue/RevenueEntryForm'

export default async function RevenueDatePage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const { date } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('site_id')
    .eq('id', user.id)
    .single()

  if (!profile?.site_id) redirect('/dashboard')
  const siteId = profile.site_id

  const { data: revenue } = await supabase
    .from('daily_revenue')
    .select('id, date, total_revenue, cash_total, card_total, wash_count, notes')
    .eq('site_id', siteId)
    .eq('date', date)
    .single()

  if (!revenue) redirect('/revenue')

  const { data: lineItemRows } = await supabase
    .from('revenue_line_items')
    .select('service_type, vehicle_type, quantity, unit_price, line_total')
    .eq('daily_revenue_id', revenue.id)
    .order('service_type')

  const lineItems = lineItemRows ?? []

  const [serviceTypes, vehicleTypes, priceMatrix] = await Promise.all([
    getServiceTypes(siteId),
    getVehicleTypes(siteId),
    getPriceMatrix(siteId),
  ])

  const activeServices = serviceTypes.filter(s => s.active)
  const activeVehicles = vehicleTypes.filter(v => v.active)

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Summary strip */}
      <div className="bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-2xl px-4 py-4 flex flex-wrap gap-6">
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Total
            </p>
            <p className="text-lg font-bold text-neutral-900">
              {formatZAR(revenue.total_revenue)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Washes
            </p>
            <p className="text-lg font-bold text-neutral-900">{revenue.wash_count}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Cash
            </p>
            <p className="text-lg font-bold text-neutral-900">
              {formatZAR(revenue.cash_total)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Card
            </p>
            <p className="text-lg font-bold text-neutral-900">
              {formatZAR(revenue.card_total)}
            </p>
          </div>
        </div>
      </div>

      {/* Line items breakdown */}
      {lineItems.length > 0 && (
        <div className="mx-auto max-w-2xl px-4 pt-6">
          <div className="rounded-xl bg-white shadow-sm border border-neutral-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100">
              <h2 className="text-base font-semibold text-neutral-900">Line Items</h2>
            </div>
            <table className="min-w-full divide-y divide-neutral-100">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Service
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Vehicle
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Qty
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Unit
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {lineItems.map((li, i) => (
                  <tr key={i} className="hover:bg-neutral-50">
                    <td className="px-4 py-2 text-sm text-neutral-900">{li.service_type}</td>
                    <td className="px-4 py-2 text-sm text-neutral-900">{li.vehicle_type}</td>
                    <td className="px-4 py-2 text-sm text-right text-neutral-900">
                      {li.quantity}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-neutral-700">
                      {formatZAR(li.unit_price)}
                    </td>
                    <td className="px-4 py-2 text-sm font-semibold text-right text-neutral-900">
                      {formatZAR(li.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit form */}
      <RevenueEntryForm
        serviceTypes={activeServices}
        vehicleTypes={activeVehicles}
        priceMatrix={priceMatrix}
        initialDate={date}
        existingEntry={{
          id: revenue.id,
          date: revenue.date,
          cash_total: revenue.cash_total,
          card_total: revenue.card_total,
          notes: revenue.notes,
          lineItems,
        }}
      />
    </div>
  )
}
