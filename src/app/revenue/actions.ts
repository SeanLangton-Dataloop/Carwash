'use server'

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

interface LineItemInput {
  service_type: string
  vehicle_type: string
  quantity: number
  unit_price: number
}

interface RevenueParams {
  date: string
  lineItems: LineItemInput[]
  cashTotal: number
  cardTotal: number
  notes: string
}

async function getAuthSite() {
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

  return { supabase, userId: user.id, siteId: profile.site_id as string }
}

export async function checkDateExists(date: string): Promise<boolean> {
  const { supabase, siteId } = await getAuthSite()
  const { data } = await supabase
    .from('daily_revenue')
    .select('id')
    .eq('site_id', siteId)
    .eq('date', date)
    .maybeSingle()
  return !!data
}

export async function createDailyRevenue(
  params: RevenueParams
): Promise<{ error?: string }> {
  const { supabase, userId, siteId } = await getAuthSite()

  const { data: existing } = await supabase
    .from('daily_revenue')
    .select('id')
    .eq('site_id', siteId)
    .eq('date', params.date)
    .maybeSingle()

  if (existing) return { error: 'An entry already exists for this date.' }

  const grandTotal = params.lineItems.reduce(
    (s, li) => s + li.quantity * li.unit_price,
    0
  )
  const washCount = params.lineItems.reduce((s, li) => s + li.quantity, 0)

  const { data: revenue, error: revErr } = await supabase
    .from('daily_revenue')
    .insert({
      site_id: siteId,
      date: params.date,
      cash_total: params.cashTotal,
      card_total: params.cardTotal,
      total_revenue: grandTotal,
      wash_count: washCount,
      notes: params.notes || null,
      created_by: userId,
    })
    .select('id')
    .single()

  if (revErr || !revenue) return { error: revErr?.message ?? 'Failed to save.' }

  if (params.lineItems.length > 0) {
    const { error: itemErr } = await supabase.from('revenue_line_items').insert(
      params.lineItems.map(li => ({
        daily_revenue_id: revenue.id,
        site_id: siteId,
        service_type: li.service_type,
        vehicle_type: li.vehicle_type,
        quantity: li.quantity,
        unit_price: li.unit_price,
        line_total: li.quantity * li.unit_price,
      }))
    )

    if (itemErr) {
      await supabase.from('daily_revenue').delete().eq('id', revenue.id)
      return { error: itemErr.message }
    }
  }

  revalidatePath('/revenue')
  return {}
}

export async function updateDailyRevenue(
  revenueId: string,
  params: RevenueParams
): Promise<{ error?: string }> {
  const { supabase, siteId } = await getAuthSite()

  const grandTotal = params.lineItems.reduce(
    (s, li) => s + li.quantity * li.unit_price,
    0
  )
  const washCount = params.lineItems.reduce((s, li) => s + li.quantity, 0)

  const { error: updateErr } = await supabase
    .from('daily_revenue')
    .update({
      cash_total: params.cashTotal,
      card_total: params.cardTotal,
      total_revenue: grandTotal,
      wash_count: washCount,
      notes: params.notes || null,
    })
    .eq('id', revenueId)
    .eq('site_id', siteId)

  if (updateErr) return { error: updateErr.message }

  await supabase
    .from('revenue_line_items')
    .delete()
    .eq('daily_revenue_id', revenueId)

  if (params.lineItems.length > 0) {
    const { error: itemErr } = await supabase.from('revenue_line_items').insert(
      params.lineItems.map(li => ({
        daily_revenue_id: revenueId,
        site_id: siteId,
        service_type: li.service_type,
        vehicle_type: li.vehicle_type,
        quantity: li.quantity,
        unit_price: li.unit_price,
        line_total: li.quantity * li.unit_price,
      }))
    )

    if (itemErr) return { error: itemErr.message }
  }

  revalidatePath(`/revenue/${params.date}`)
  revalidatePath('/revenue')
  return {}
}
