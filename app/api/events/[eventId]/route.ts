import { createClient } from '@/lib/supabase/server'
import * as EventController from '@/controllers/event.controller'
import { requireTripRole, ForbiddenError } from '@/lib/auth/rbac'
import { NextRequest, NextResponse } from 'next/server'
import * as EventModel from '@/models/event.model'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await EventModel.getEventById(eventId)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await requireTripRole(existing.trip_id, user.id, 'editor')

    const body = await request.json()
    const updated = await EventController.updateEvent(eventId, body)
    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await EventModel.getEventById(eventId)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await requireTripRole(existing.trip_id, user.id, 'editor')
    await EventController.deleteEvent(eventId)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
