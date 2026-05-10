'use server'

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { Json } from '@/lib/database.types'
import type { ServiceType, VehicleType, PriceMatrix } from '@/lib/types'

async function getAdminSiteId(): Promise<string> {
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
  return profile.site_id as string
}

export async function saveSiteDetails(formData: FormData): Promise<{ error?: string }> {
  const siteId = await getAdminSiteId()
  const supabase = await createClient()

  const name = (formData.get('name') as string).trim()
  const location_name = (formData.get('location_name') as string).trim()
  const latStr = formData.get('latitude') as string
  const lngStr = formData.get('longitude') as string
  const latitude = latStr ? parseFloat(latStr) : null
  const longitude = lngStr ? parseFloat(lngStr) : null

  const { error } = await supabase
    .from('sites')
    .update({ name, location_name, latitude, longitude })
    .eq('id', siteId)

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return {}
}

export async function saveServiceTypes(types: ServiceType[]): Promise<{ error?: string }> {
  const siteId = await getAdminSiteId()
  const supabase = await createClient()

  const { error } = await supabase
    .from('app_config')
    .upsert({ site_id: siteId, key: 'service_types', value: types as unknown as Json })

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return {}
}

export async function saveVehicleTypes(types: VehicleType[]): Promise<{ error?: string }> {
  const siteId = await getAdminSiteId()
  const supabase = await createClient()

  const { error } = await supabase
    .from('app_config')
    .upsert({ site_id: siteId, key: 'vehicle_types', value: types as unknown as Json })

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return {}
}

export async function savePriceMatrix(matrix: PriceMatrix): Promise<{ error?: string }> {
  const siteId = await getAdminSiteId()
  const supabase = await createClient()

  const { error } = await supabase
    .from('app_config')
    .upsert({ site_id: siteId, key: 'price_matrix', value: matrix as unknown as Json })

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return {}
}
