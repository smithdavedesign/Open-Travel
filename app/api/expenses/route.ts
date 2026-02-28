import { createClient } from '@/lib/supabase/server'
import * as ExpenseController from '@/controllers/expense.controller'
import { requireTripRole, ForbiddenError } from '@/lib/auth/rbac'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tripId = request.nextUrl.searchParams.get('tripId')
    if (!tripId) return NextResponse.json({ error: 'tripId is required' }, { status: 400 })

    const expenses = await ExpenseController.getTripExpenses(tripId)
    return NextResponse.json(expenses)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { tripId, memberIds, splitMode, splitValues, ...expenseData } = body

    if (!tripId || !memberIds?.length) {
      return NextResponse.json({ error: 'tripId and memberIds are required' }, { status: 400 })
    }

    await requireTripRole(tripId, user.id, 'editor')
    const expense = await ExpenseController.addExpense(
      tripId,
      { ...expenseData, paid_by: expenseData.paid_by ?? user.id },
      memberIds,
      splitMode ?? 'equal',
      splitValues // userId → value map (used for exact/percentage/shares)
    )
    return NextResponse.json(expense, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[POST /api/expenses] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
