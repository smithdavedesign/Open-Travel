import * as ExpenseModel from '@/models/expense.model'
import { logActivity } from '@/controllers/activity.controller'
import type { Expense, ExpenseSplit, Balance, SplitMode } from '@/types'

export async function getTripExpenses(tripId: string) {
  return ExpenseModel.getExpensesByTrip(tripId)
}

export async function addExpense(
  tripId: string,
  data: Omit<Expense, 'id' | 'created_at'>,
  memberIds: string[],
  splitMode: SplitMode = 'equal',
  splitValues?: Record<string, number> // userId → value (exact $ | pct | shares)
): Promise<Expense> {
  const expense = await ExpenseModel.createExpense({ ...data, trip_id: tripId })

  const splits = buildSplits(expense.id, expense.amount, memberIds, splitMode, splitValues)
  await ExpenseModel.upsertSplits(splits)

  logActivity({
    tripId, userId: data.paid_by, action: 'added_expense',
    entityType: 'expense', entityId: expense.id,
    metadata: { title: expense.title, amount: expense.amount, currency: expense.currency },
  })
  return expense
}

export async function deleteExpense(expenseId: string): Promise<void> {
  return ExpenseModel.deleteExpense(expenseId)
}

export async function recordSettlement(
  tripId: string,
  fromUserId: string,
  toUserId: string,
  amount: number,
  currency: string,
  method?: string
) {
  const settlement = await ExpenseModel.createSettlement({
    trip_id: tripId,
    from_user_id: fromUserId,
    to_user_id: toUserId,
    amount,
    currency,
    method: method ?? null,
    settled_at: new Date().toISOString(),
  })
  logActivity({
    tripId, userId: fromUserId, action: 'recorded_settlement',
    entityType: 'settlement', entityId: settlement.id,
    metadata: { amount, currency, to_user_id: toUserId, method: method ?? null },
  })
  return settlement
}

export async function computeBalances(tripId: string): Promise<Record<string, Balance>> {
  const [expenses, settlements] = await Promise.all([
    ExpenseModel.getExpensesByTrip(tripId),
    ExpenseModel.getSettlementsByTrip(tripId),
  ])

  const balances: Record<string, Balance> = {}

  const ensure = (userId: string) => {
    if (!balances[userId]) balances[userId] = { userId, owes: {}, owed: {}, net: 0 }
  }

  for (const expense of expenses) {
    const splits = await ExpenseModel.getSplitsForExpense(expense.id)
    ensure(expense.paid_by)

    for (const split of splits) {
      if (split.user_id === expense.paid_by) continue
      ensure(split.user_id)

      balances[split.user_id].owes[expense.paid_by] =
        (balances[split.user_id].owes[expense.paid_by] ?? 0) + split.amount
      balances[expense.paid_by].owed[split.user_id] =
        (balances[expense.paid_by].owed[split.user_id] ?? 0) + split.amount
    }
  }

  // Apply settlements
  for (const settlement of settlements) {
    ensure(settlement.from_user_id)
    ensure(settlement.to_user_id)

    balances[settlement.from_user_id].owes[settlement.to_user_id] = Math.max(
      0,
      (balances[settlement.from_user_id].owes[settlement.to_user_id] ?? 0) - settlement.amount
    )
    balances[settlement.to_user_id].owed[settlement.from_user_id] = Math.max(
      0,
      (balances[settlement.to_user_id].owed[settlement.from_user_id] ?? 0) - settlement.amount
    )
  }

  // Compute net for each user
  for (const userId in balances) {
    const owed = Object.values(balances[userId].owed).reduce((s, v) => s + v, 0)
    const owes = Object.values(balances[userId].owes).reduce((s, v) => s + v, 0)
    balances[userId].net = owed - owes
  }

  return balances
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function buildSplits(
  expenseId: string,
  total: number,
  memberIds: string[],
  mode: SplitMode,
  values?: Record<string, number> // userId → value
): Omit<ExpenseSplit, 'id'>[] {
  const make = (userId: string, amount: number) => ({
    expense_id: expenseId,
    user_id: userId,
    amount: round2(amount),
    split_mode: mode,
  })

  if (mode === 'equal') {
    const share = total / memberIds.length
    return memberIds.map(id => make(id, share))
  }

  if (mode === 'exact') {
    // values[userId] = exact dollar amount owed by that member
    return memberIds.map(id => make(id, values?.[id] ?? 0))
  }

  if (mode === 'percentage') {
    // values[userId] = percentage (0-100), must sum to 100
    return memberIds.map(id => make(id, total * (values?.[id] ?? 0) / 100))
  }

  if (mode === 'shares') {
    // values[userId] = number of shares (integer), proportional split
    const totalShares = memberIds.reduce((s, id) => s + (values?.[id] ?? 1), 0)
    if (totalShares === 0) return memberIds.map(id => make(id, 0))
    return memberIds.map(id => make(id, total * (values?.[id] ?? 1) / totalShares))
  }

  return []
}
