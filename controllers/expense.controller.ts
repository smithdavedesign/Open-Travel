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
  splitMode: SplitMode = 'equal'
): Promise<Expense> {
  const expense = await ExpenseModel.createExpense({ ...data, trip_id: tripId })

  const splits = buildSplits(expense.id, expense.amount, memberIds, splitMode)
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

function buildSplits(
  expenseId: string,
  total: number,
  memberIds: string[],
  mode: SplitMode
): Omit<ExpenseSplit, 'id'>[] {
  if (mode === 'equal') {
    const share = Math.round((total / memberIds.length) * 100) / 100
    return memberIds.map((userId) => ({
      expense_id: expenseId,
      user_id: userId,
      amount: share,
      split_mode: mode,
    }))
  }
  // Other modes (exact, percentage, shares) handled when frontend sends amounts directly
  return []
}
