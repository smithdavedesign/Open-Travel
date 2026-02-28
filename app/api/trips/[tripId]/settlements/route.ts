import { createClient } from '@/lib/supabase/server'
import * as ExpenseController from '@/controllers/expense.controller'
import * as ExpenseModel from '@/models/expense.model'
import { requireTripRole, ForbiddenError } from '@/lib/auth/rbac'
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
    const settlements = await ExpenseModel.getSettlementsByTrip(tripId)
    return NextResponse.json(settlements)
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
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
    await requireTripRole(tripId, user.id, 'editor')

    const { from_user_id, to_user_id, amount, currency, method } = await request.json()
    if (!from_user_id || !to_user_id || !amount) {
      return NextResponse.json({ error: 'from_user_id, to_user_id and amount are required' }, { status: 400 })
    }

    const settlement = await ExpenseController.recordSettlement(
      tripId, from_user_id, to_user_id, amount, currency ?? 'USD', method
    )
    return NextResponse.json(settlement, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
