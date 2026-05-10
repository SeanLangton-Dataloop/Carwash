import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as unknown
  const email =
    body !== null && typeof body === 'object' && 'email' in body
      ? (body as Record<string, unknown>).email
      : undefined

  if (typeof email !== 'string' || !email.trim()) {
    return Response.json({ error: 'A valid email address is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, site_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin' || !profile.site_id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const siteId = profile.site_id
  const supabaseAdmin = createAdminClient()

  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email.trim(),
    {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard`,
      data: { role: 'manager', site_id: siteId },
    },
  )

  if (inviteError) {
    return Response.json({ error: inviteError.message }, { status: 400 })
  }

  if (inviteData.user?.id) {
    await supabaseAdmin
      .from('profiles')
      .upsert({ id: inviteData.user.id, role: 'manager', site_id: siteId })
  }

  return Response.json({ success: true })
}
