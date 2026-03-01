import { createClient } from '@/lib/supabase/server'
import * as ExpenseController from '@/controllers/expense.controller'
import * as ExpenseModel from '@/models/expense.model'
import { requireTripRole, ForbiddenError } from '@/lib/auth/rbac'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { expenseId } = await params
    const expense = await ExpenseModel.getExpenseById(expenseId)
    if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await requireTripRole(expense.trip_id, user.id, 'editor')

    const body = await request.json()
    const { memberIds, splitMode, splitValues, ...updates } = body

    const updated = await ExpenseController.updateExpense(expenseId, updates, memberIds, splitMode, splitValues)
    return NextResponse.json(updated)
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { expenseId } = await params

    // Look up the expense to get trip_id for RBAC check
    const expense = await ExpenseModel.getExpenseById(expenseId)
    if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await requireTripRole(expense.trip_id, user.id, 'editor')
    await ExpenseController.deleteExpense(expenseId)
    return new NextResponse(null, { status: 204 })
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
