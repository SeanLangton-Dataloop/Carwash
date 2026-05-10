import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as unknown
  const userId =
    body !== null && typeof body === 'object' && 'userId' in body
      ? (body as Record<string, unknown>).userId
      : undefined

  if (typeof userId !== 'string') {
    return Response.json({ error: 'userId is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user.id === userId) {
    return Response.json({ error: 'You cannot remove yourself' }, { status: 400 })
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role, site_id')
    .eq('id', user.id)
    .single()

  if (!callerProfile || callerProfile.role !== 'admin' || !callerProfile.site_id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('site_id')
    .eq('id', userId)
    .single()

  if (!targetProfile || targetProfile.site_id !== callerProfile.site_id) {
    return Response.json({ error: 'User not found in this site' }, { status: 404 })
  }

  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }

  await supabaseAdmin.from('profiles').delete().eq('id', userId)

  return Response.json({ success: true })
}
