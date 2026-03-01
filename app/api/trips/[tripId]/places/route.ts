import { createClient } from '@/lib/supabase/server'
import * as ListController from '@/controllers/list.controller'
import { requireTripRole, ForbiddenError } from '@/lib/auth/rbac'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const places = await ListController.getPlaces(tripId)
  return NextResponse.json(places)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await requireTripRole(tripId, user.id, 'editor')

    const body = await request.json()
    const place = await ListController.createPlace(tripId, user.id, body)
    return NextResponse.json(place, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
