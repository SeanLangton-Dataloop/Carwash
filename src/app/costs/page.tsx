import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import CostsClient from './CostsClient'

export default async function CostsPage() {
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

  const { data: rows } = await supabase
    .from('costs')
    .select('id, date, description, amount, category, notes')
    .eq('site_id', profile.site_id)
    .order('date', { ascending: false })

  const allCosts = rows ?? []

  // Current month in SA timezone: "YYYY-MM"
  const yearMonth = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
  })

  const monthLabel = new Date().toLocaleDateString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    month: 'long',
    year: 'numeric',
  })

  const cosEntries = allCosts.filter(c => c.category === 'cos')
  const capexEntries = allCosts.filter(c => c.category === 'capex')

  const monthlyCos = cosEntries
    .filter(c => c.date.startsWith(yearMonth))
    .reduce((sum, c) => sum + c.amount, 0)

  const monthlyCapex = capexEntries
    .filter(c => c.date.startsWith(yearMonth))
    .reduce((sum, c) => sum + c.amount, 0)

  return (
    <CostsClient
      cosEntries={cosEntries}
      capexEntries={capexEntries}
      monthlyCos={monthlyCos}
      monthlyCapex={monthlyCapex}
      monthLabel={monthLabel}
    />
  )
}
