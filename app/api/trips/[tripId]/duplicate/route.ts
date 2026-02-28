import { createClient } from '@/lib/supabase/server'
import * as TripController from '@/controllers/trip.controller'
import { requireTripRole, ForbiddenError } from '@/lib/auth/rbac'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tripId } = await params
    await requireTripRole(tripId, user.id, 'editor')

    const newTrip = await TripController.duplicateTrip(tripId, user.id)
    return NextResponse.json(newTrip, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
