import { createClient } from '@/lib/supabase/server'
import * as ListController from '@/controllers/list.controller'
import * as ListModel from '@/models/list.model'
import { requireTripRole, ForbiddenError } from '@/lib/auth/rbac'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ tripId: string; itemId: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { tripId, itemId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await requireTripRole(tripId, user.id, 'editor')

    const body = await request.json()
    const item = await ListController.updateChecklistItem(itemId, body)
    return NextResponse.json(item)
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: Params
) {
  try {
    const { tripId, itemId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await requireTripRole(tripId, user.id, 'editor')
    await ListController.deleteChecklistItem(itemId)
    return new NextResponse(null, { status: 204 })
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
