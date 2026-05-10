import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import NewCostForm from './NewCostForm'

export default async function NewCostPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Africa/Johannesburg',
  })

  return <NewCostForm initialDate={today} />
}
