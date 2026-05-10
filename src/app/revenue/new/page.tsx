import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { getServiceTypes, getVehicleTypes, getPriceMatrix, getDiscountRules } from '@/lib/config'
import RevenueEntryForm from '@/components/revenue/RevenueEntryForm'

export default async function NewRevenuePage() {
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

  const [serviceTypes, vehicleTypes, priceMatrix, discountRules] = await Promise.all([
    getServiceTypes(siteId),
    getVehicleTypes(siteId),
    getPriceMatrix(siteId),
    getDiscountRules(siteId),
  ])

  const activeServices = serviceTypes.filter(s => s.active)
  const activeVehicles = vehicleTypes.filter(v => v.active)

  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Africa/Johannesburg',
  })

  return (
    <RevenueEntryForm
      serviceTypes={activeServices}
      vehicleTypes={activeVehicles}
      priceMatrix={priceMatrix}
      initialDate={today}
      discountRules={discountRules}
    />
  )
}
