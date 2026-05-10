'use server'

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function getAdminSite() {
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
  return { supabase, siteId: profile.site_id as string }
}

interface StaffParams {
  full_name: string
  role: string
  daily_rate: number
  phone: string
}

export async function createStaff(params: StaffParams): Promise<{ error?: string }> {
  const { supabase, siteId } = await getAdminSite()

  const { error } = await supabase.from('staff').insert({
    site_id: siteId,
    full_name: params.full_name,
    role: params.role,
    daily_rate: params.daily_rate,
    phone: params.phone || null,
    is_active: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/staff')
  return {}
}

export async function updateStaff(
  id: string,
  params: StaffParams
): Promise<{ error?: string }> {
  const { supabase, siteId } = await getAdminSite()

  const { error } = await supabase
    .from('staff')
    .update({
      full_name: params.full_name,
      role: params.role,
      daily_rate: params.daily_rate,
      phone: params.phone || null,
    })
    .eq('id', id)
    .eq('site_id', siteId)

  if (error) return { error: error.message }
  revalidatePath('/staff')
  revalidatePath(`/staff/${id}`)
  return {}
}

export async function deactivateStaff(id: string): Promise<{ error?: string }> {
  const { supabase, siteId } = await getAdminSite()

  const { error } = await supabase
    .from('staff')
    .update({ is_active: false })
    .eq('id', id)
    .eq('site_id', siteId)

  if (error) return { error: error.message }
  revalidatePath('/staff')
  revalidatePath(`/staff/${id}`)
  return {}
}
