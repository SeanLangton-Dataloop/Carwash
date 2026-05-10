import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import StaffForm from '@/components/staff/StaffForm'

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

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

  const { data: member } = await supabase
    .from('staff')
    .select('id, full_name, role, daily_rate, phone, is_active')
    .eq('id', id)
    .eq('site_id', profile.site_id)
    .single()

  if (!member) redirect('/staff')

  return (
    <StaffForm
      existingStaff={{
        id: member.id,
        full_name: member.full_name,
        role: member.role,
        daily_rate: member.daily_rate,
        phone: member.phone,
        is_active: member.is_active,
      }}
    />
  )
}
