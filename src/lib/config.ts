import { createClient } from './supabase-server'
import type { Json } from './database.types'
import type { ServiceType, VehicleType, PriceMatrix } from './types'

const defaultServiceTypes: ServiceType[] = [
  { name: 'Basic Wash', active: true },
  { name: 'Full Wash', active: true },
  { name: 'Valet', active: true },
]

const defaultVehicleTypes: VehicleType[] = [
  { name: 'Car', active: true },
  { name: 'Van', active: true },
  { name: 'SUV', active: true },
  { name: 'Bakkie', active: true },
  { name: 'Motorcycle', active: true },
]

export async function getConfig(siteId: string, key: string): Promise<unknown> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('app_config')
    .select('value')
    .eq('site_id', siteId)
    .eq('key', key)
    .single()
  return data?.value ?? null
}

export async function setConfig(siteId: string, key: string, value: unknown): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('app_config')
    .upsert({ site_id: siteId, key, value: value as Json })
}

export async function getServiceTypes(siteId: string): Promise<ServiceType[]> {
  const data = await getConfig(siteId, 'service_types')
  if (!Array.isArray(data)) return defaultServiceTypes
  return data as ServiceType[]
}

export async function getVehicleTypes(siteId: string): Promise<VehicleType[]> {
  const data = await getConfig(siteId, 'vehicle_types')
  if (!Array.isArray(data)) return defaultVehicleTypes
  return data as VehicleType[]
}

export async function getPriceMatrix(siteId: string): Promise<PriceMatrix> {
  const data = await getConfig(siteId, 'price_matrix')
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
  return data as PriceMatrix
}
