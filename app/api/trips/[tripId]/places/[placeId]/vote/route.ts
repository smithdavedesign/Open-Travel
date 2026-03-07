import { createClient } from '@/lib/supabase/server'
import * as ListController from '@/controllers/list.controller'
import { requireTripRole, ForbiddenError } from '@/lib/auth/rbac'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ tripId: string; placeId: string }> }

// POST /api/trips/[tripId]/places/[placeId]/vote — cast or change vote
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { tripId, placeId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Any trip member (including viewers) can vote
    await requireTripRole(tripId, user.id, 'viewer')

    const body = await request.json()
    const vote = body.vote
    if (vote !== 1 && vote !== -1) {
      return NextResponse.json({ error: 'vote must be 1 or -1' }, { status: 400 })
    }

    await ListController.voteOnPlace(placeId, user.id, vote)
    return new NextResponse(null, { status: 204 })
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/trips/[tripId]/places/[placeId]/vote — remove vote
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { tripId, placeId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await requireTripRole(tripId, user.id, 'viewer')
    await ListController.voteOnPlace(placeId, user.id, null)
    return new NextResponse(null, { status: 204 })
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
