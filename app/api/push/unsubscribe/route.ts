import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { endpoint } = await request.json()
    if (!endpoint) return NextResponse.json({ error: 'endpoint required' }, { status: 400 })

    const { error } = await adminSupabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .filter('subscription->endpoint', 'eq', endpoint)

    if (error) throw error
    return new NextResponse(null, { status: 204 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
