import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle } from 'lucide-react'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function AcceptInvitePage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    return <ErrorCard message="Invalid invite link — no token found." />
  }

  // Must be logged in (Supabase redirects here after the user sets up their account)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Not logged in yet — send to login, then back here
    redirect(`/login?next=/accept-invite?token=${token}`)
  }

  // Look up the pending invite
  const { data: invite, error: inviteErr } = await adminSupabase
    .from('trip_invites')
    .select('id, trip_id, email, role, accepted_at')
    .eq('id', token)
    .single()

  if (inviteErr || !invite) {
    return <ErrorCard message="Invite not found or has expired." />
  }

  if (invite.accepted_at) {
    // Already accepted — just send them to the trip
    redirect(`/trips/${invite.trip_id}`)
  }

  // Verify the logged-in user's email matches the invite
  if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <ErrorCard message={`This invite was sent to ${invite.email}. Please sign in with that email address to accept it.`} />
    )
  }

  // Check the user has a profile (trigger should have created it, but be safe)
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Trigger may not have fired yet — insert the profile manually
    await adminSupabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    })
  }

  // Check if already a member (idempotent)
  const { data: existing } = await adminSupabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', invite.trip_id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    const { error: memberErr } = await adminSupabase
      .from('trip_members')
      .insert({ trip_id: invite.trip_id, user_id: user.id, role: invite.role })

    if (memberErr) {
      return <ErrorCard message="Failed to add you to the trip. Please contact the trip owner." />
    }
  }

  // Mark invite accepted
  await adminSupabase
    .from('trip_invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', token)

  // Fetch trip name for the success screen
  const { data: trip } = await adminSupabase
    .from('trips')
    .select('id, name')
    .eq('id', invite.trip_id)
    .single()

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="bg-card border rounded-2xl p-8 max-w-sm w-full text-center space-y-4 shadow-sm">
        <div className="flex justify-center">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">You&apos;re in!</h1>
          <p className="text-sm text-muted-foreground mt-1">
            You&apos;ve joined <span className="font-semibold text-foreground">{trip?.name ?? 'the trip'}</span> as{' '}
            <span className="capitalize">{invite.role}</span>.
          </p>
        </div>
        <Link
          href={`/trips/${invite.trip_id}`}
          className="inline-flex items-center justify-center w-full rounded-lg bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 hover:bg-primary/90 transition-colors"
        >
          Open trip
        </Link>
      </div>
    </div>
  )
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="bg-card border rounded-2xl p-8 max-w-sm w-full text-center space-y-4 shadow-sm">
        <div className="flex justify-center">
          <XCircle className="h-12 w-12 text-destructive" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Invite error</h1>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
        </div>
        <Link
          href="/trips"
          className="inline-flex items-center justify-center w-full rounded-lg border border-border text-sm font-medium px-4 py-2.5 hover:bg-muted transition-colors"
        >
          Go to my trips
        </Link>
      </div>
    </div>
  )
}
