'use server'

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Json } from '@/lib/database.types'
import type { ServiceType, VehicleType, PriceMatrix, DiscountRule } from '@/lib/types'

const discountRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  day_of_week: z.union([
    z.literal(0), z.literal(1), z.literal(2),
    z.literal(3), z.literal(4), z.literal(5), z.literal(6),
  ]),
  percentage: z.number().int().min(1).max(100),
  active: z.boolean(),
})

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

export async function saveDiscountRules(rules: DiscountRule[]): Promise<{ error?: string }> {
  const parsed = z.array(discountRuleSchema).safeParse(rules)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid discount rules' }
  }

  const siteId = await getAdminSiteId()
  const supabase = await createClient()

  const { error } = await supabase
    .from('app_config')
    .upsert({ site_id: siteId, key: 'discount_rules', value: parsed.data as unknown as Json })

  if (error) return { error: error.message }
  revalidatePath('/settings')
  revalidatePath('/revenue')
  return {}
}
