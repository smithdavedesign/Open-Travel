import { adminSupabase } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

// Internal server-only endpoint — not exposed to clients
// Called by controllers/services to send push notifications to trip members

function vapidSubject(): string {
  const raw = process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com'
  // Ensure the subject is a valid URL — prepend mailto: for bare email addresses
  if (!raw.startsWith('http://') && !raw.startsWith('https://') && !raw.startsWith('mailto:')) {
    return `mailto:${raw}`
  }
  return raw
}

webpush.setVapidDetails(
  vapidSubject(),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
  process.env.VAPID_PRIVATE_KEY ?? ''
)

export async function POST(request: NextRequest) {
  // Require internal secret to prevent external calls
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { userIds, title, body, url } = await request.json()
    if (!userIds?.length || !title) {
      return NextResponse.json({ error: 'userIds and title required' }, { status: 400 })
    }

    const { data: subs, error } = await adminSupabase
      .from('push_subscriptions')
      .select('subscription')
      .in('user_id', userIds)

    if (error) throw error

    const payload = JSON.stringify({ title, body, url })
    const results = await Promise.allSettled(
      (subs ?? []).map(row =>
        webpush.sendNotification(row.subscription as webpush.PushSubscription, payload)
      )
    )

    const failed = results.filter(r => r.status === 'rejected').length
    return NextResponse.json({ sent: results.length - failed, failed })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
