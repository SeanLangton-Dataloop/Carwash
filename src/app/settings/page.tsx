import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { getServiceTypes, getVehicleTypes, getPriceMatrix } from '@/lib/config'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, site_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin' || !profile.site_id) redirect('/dashboard')
  const siteId = profile.site_id

  const { data: site } = await supabase
    .from('sites')
    .select('id, name, location_name, latitude, longitude')
    .eq('id', siteId)
    .single()

  const [serviceTypes, vehicleTypes, priceMatrix] = await Promise.all([
    getServiceTypes(siteId),
    getVehicleTypes(siteId),
    getPriceMatrix(siteId),
  ])

  return (
    <SettingsClient
      site={
        site ?? {
          id: profile.site_id,
          name: '',
          location_name: null,
          latitude: null,
          longitude: null,
        }
      }
      serviceTypes={serviceTypes}
      vehicleTypes={vehicleTypes}
      priceMatrix={priceMatrix}
    />
  )
}
