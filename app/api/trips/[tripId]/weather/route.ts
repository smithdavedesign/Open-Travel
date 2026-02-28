import { createClient } from '@/lib/supabase/server'
import { requireTripRole, ForbiddenError } from '@/lib/auth/rbac'
import * as TripModel from '@/models/trip.model'
import { fetchTripWeather } from '@/lib/weather/openmeteo'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tripId } = await params
    await requireTripRole(tripId, user.id, 'viewer')

    const trip = await TripModel.getTripById(tripId)
    if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const weather = await fetchTripWeather(trip.destinations, trip.start_date, trip.end_date)

    // Return empty daily if no weather available — client handles gracefully
    return NextResponse.json(weather ?? { location: null, daily: {} })
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    return NextResponse.json({ daily: {} }, { status: 200 }) // degrade silently
  }
}
