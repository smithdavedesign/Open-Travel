import { createClient } from '@/lib/supabase/server'
import * as TripController from '@/controllers/trip.controller'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const trips = await TripController.getUserTrips(user.id)
    return NextResponse.json(trips)
  } catch (err) {
    console.error('[GET /api/trips]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    console.log('[POST /api/trips] user:', user?.id ?? 'null')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    console.log('[POST /api/trips] body:', JSON.stringify(body))
    const trip = await TripController.createTrip(user.id, body)
    return NextResponse.json(trip, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error
      ? err.message
      : typeof err === 'object' && err !== null && 'message' in err
        ? String((err as Record<string, unknown>).message)
        : JSON.stringify(err)
    console.error('[POST /api/trips] error:', JSON.stringify(err, null, 2))
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
