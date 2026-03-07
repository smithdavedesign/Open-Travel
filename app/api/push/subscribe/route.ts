import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const subscription = await request.json()
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    // Delete any existing row for this user+endpoint, then insert fresh
    await adminSupabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .filter('subscription->endpoint', 'eq', `"${subscription.endpoint}"`)

    const { error } = await adminSupabase
      .from('push_subscriptions')
      .insert({ user_id: user.id, subscription })

    if (error) throw error
    return new NextResponse(null, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
