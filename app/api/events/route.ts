import { createClient } from '@/lib/supabase/server'
import * as EventController from '@/controllers/event.controller'
import { requireTripRole, ForbiddenError } from '@/lib/auth/rbac'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tripId = request.nextUrl.searchParams.get('tripId')
  if (!tripId) return NextResponse.json({ error: 'tripId is required' }, { status: 400 })

  const timeline = await EventController.getTripTimeline(tripId)
  return NextResponse.json(timeline)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { tripId, ...eventData } = body
    if (!tripId) return NextResponse.json({ error: 'tripId is required' }, { status: 400 })

    await requireTripRole(tripId, user.id, 'editor')
    const event = await EventController.createEvent(tripId, user.id, eventData)
    return NextResponse.json(event, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
