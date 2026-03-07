import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import * as TripController from '@/controllers/trip.controller'
import { requireTripRole, ForbiddenError } from '@/lib/auth/rbac'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId } = await params
  const { members } = await TripController.getTripWithMembers(tripId)
  return NextResponse.json(members)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tripId } = await params
    await requireTripRole(tripId, user.id, 'owner')

    const { email, role } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !profile) {
      // No account yet — store a pending invite and send them a signup email
      const normalizedEmail = email.toLowerCase().trim()

      // Upsert the pending invite (replace if they were already invited)
      const { data: invite, error: inviteErr } = await adminSupabase
        .from('trip_invites')
        .upsert(
          { trip_id: tripId, email: normalizedEmail, role: role ?? 'editor', invited_by: user.id, accepted_at: null },
          { onConflict: 'trip_id,email' }
        )
        .select('id')
        .single()

      if (inviteErr || !invite) {
        return NextResponse.json({ error: 'Failed to create invite.' }, { status: 500 })
      }

      const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${invite.id}`

      const { error: emailErr } = await adminSupabase.auth.admin.inviteUserByEmail(normalizedEmail, {
        redirectTo: acceptUrl,
      })

      // "User already registered" means they have an auth account but no profile row yet — uncommon but handle gracefully
      if (emailErr && !emailErr.message.includes('already registered')) {
        return NextResponse.json({ error: emailErr.message }, { status: 500 })
      }

      return NextResponse.json(
        { invited: true, message: `Invitation sent to ${normalizedEmail}` },
        { status: 200 }
      )
    }

    const { data: existing } = await supabase
      .from('trip_members')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', profile.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'This person is already a member of the trip.' }, { status: 409 })
    }

    const member = await TripController.inviteMemberByUserId(tripId, profile.id, role ?? 'editor', user.id)
    return NextResponse.json(member, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tripId } = await params
    await requireTripRole(tripId, user.id, 'owner')

    const { userId } = await request.json()
    await TripController.removeMember(tripId, userId)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
