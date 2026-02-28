'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AddExpenseModal from '@/components/budget/AddExpenseModal'
import ExpenseList from '@/components/budget/ExpenseList'
import BalanceSummary from '@/components/budget/BalanceSummary'
import RecordSettlementModal from '@/components/budget/RecordSettlementModal'
import BudgetTargetBar from '@/components/budget/BudgetTargetBar'
import type { Expense, TripMember, Balance, Settlement, Trip, ExpenseCategory } from '@/types'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']

function memberName(members: TripMember[], userId: string): string {
  const m = members.find(m => m.user_id === userId)
  return m?.profiles?.full_name ?? m?.profiles?.email ?? userId.slice(0, 8)
}

export default function BudgetPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [members, setMembers] = useState<TripMember[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [balances, setBalances] = useState<Record<string, Balance>>({})
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showSettle, setShowSettle] = useState(false)
  const [editingBudget, setEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')
  const [budgetCurrency, setBudgetCurrency] = useState('USD')
  const [savingBudget, setSavingBudget] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
  }, [])

  const fetchData = useCallback(async () => {
    const [tripRes, membersRes, expensesRes, balancesRes, settlementsRes] = await Promise.all([
      fetch(`/api/trips/${tripId}`),
      fetch(`/api/trips/${tripId}/members`),
      fetch(`/api/expenses?tripId=${tripId}`),
      fetch(`/api/trips/${tripId}/balances`),
      fetch(`/api/trips/${tripId}/settlements`),
    ])
    const [tripData, membersData, expensesData, balancesData, settlementsData] = await Promise.all([
      tripRes.json(),
      membersRes.json(),
      expensesRes.json(),
      balancesRes.json(),
      settlementsRes.json(),
    ])
    setTrip(tripData.trip ?? null)
    setMembers(membersData)
    setExpenses(expensesData)
    setBalances(balancesData)
    setSettlements(settlementsData)
    setLoading(false)
  }, [tripId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDelete = async (expenseId: string) => {
    await fetch(`/api/expenses/${expenseId}`, { method: 'DELETE' })
    fetchData()
  }

  const handleSaveBudget = async () => {
    if (!budgetInput) return
    setSavingBudget(true)
    await fetch(`/api/trips/${tripId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        budget: parseFloat(budgetInput),
        budget_currency: budgetCurrency,
      }),
    })
    setSavingBudget(false)
    setEditingBudget(false)
    fetchData()
  }

  const currentMember = members.find(m => m.user_id === currentUserId)
  const canEdit = currentMember?.role === 'owner' || currentMember?.role === 'editor'
  const primaryCurrency = trip?.budget_currency ?? expenses[0]?.currency ?? 'USD'
  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const hasBalances = Object.keys(balances).length > 0
  const allSettled = hasBalances && Object.values(balances).every(b => Math.abs(b.net) < 0.01)

  const categoryTotals = expenses.reduce<Partial<Record<ExpenseCategory, number>>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {})

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Budget</h2>
          {!loading && expenses.length > 0 && (
            <p className="text-sm text-slate-500 mt-0.5">
              {expenses.length} expense{expenses.length !== 1 ? 's' : ''} ·{' '}
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: primaryCurrency,
                maximumFractionDigits: 2,
              }).format(total)}{' '}
              total
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {hasBalances && !allSettled && (
            <Button variant="outline" onClick={() => setShowSettle(true)}>Settle up</Button>
          )}
          <Button onClick={() => setShowAdd(true)}>+ Add expense</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 text-center py-12">Loading…</p>
      ) : (
        <>
          {/* Budget target */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Budget target</h3>
              {canEdit && !editingBudget && (
                <button
                  onClick={() => {
                    setBudgetInput(trip?.budget?.toString() ?? '')
                    setBudgetCurrency(trip?.budget_currency ?? 'USD')
                    setEditingBudget(true)
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  {trip?.budget ? 'Edit' : 'Set budget'}
                </button>
              )}
            </div>

            {editingBudget ? (
              <div className="flex gap-2 items-center">
                <select
                  value={budgetCurrency}
                  onChange={e => setBudgetCurrency(e.target.value)}
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                >
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  value={budgetInput}
                  onChange={e => setBudgetInput(e.target.value)}
                  className="w-36"
                />
                <Button size="sm" onClick={handleSaveBudget} disabled={savingBudget}>
                  {savingBudget ? 'Saving…' : 'Save'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingBudget(false)}>
                  Cancel
                </Button>
              </div>
            ) : trip?.budget ? (
              <BudgetTargetBar
                budget={trip.budget}
                spent={total}
                currency={primaryCurrency}
                categoryTotals={categoryTotals}
              />
            ) : (
              <p className="text-sm text-slate-400">
                No budget set.{canEdit ? ' Click "Set budget" to add one.' : ''}
              </p>
            )}
          </div>

          {/* Balance summary */}
          {hasBalances && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Balances</h3>
              {allSettled ? (
                <p className="text-sm text-green-600 font-medium text-center py-2">All settled up!</p>
              ) : (
                <BalanceSummary balances={balances} members={members} currency={primaryCurrency} />
              )}
            </div>
          )}

          {/* Recent settlements */}
          {settlements.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Payments recorded</h3>
              <ul className="divide-y divide-slate-100">
                {settlements.map(s => (
                  <li key={s.id} className="py-2.5 flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      <span className="font-medium text-slate-900">{memberName(members, s.from_user_id)}</span>
                      {' paid '}
                      <span className="font-medium text-slate-900">{memberName(members, s.to_user_id)}</span>
                      {s.method ? ` via ${s.method}` : ''}
                    </span>
                    <span className="font-semibold text-slate-900 shrink-0 ml-3">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: s.currency,
                        maximumFractionDigits: 2,
                      }).format(s.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Expense list */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Expenses</h3>
            <ExpenseList
              expenses={expenses}
              members={members}
              currentUserId={currentUserId ?? ''}
              onDelete={handleDelete}
            />
          </div>
        </>
      )}

      {showAdd && currentUserId && (
        <AddExpenseModal
          tripId={tripId}
          members={members}
          currentUserId={currentUserId}
          onClose={() => setShowAdd(false)}
          onSaved={fetchData}
        />
      )}

      {showSettle && currentUserId && (
        <RecordSettlementModal
          tripId={tripId}
          members={members}
          balances={balances}
          currentUserId={currentUserId}
          onClose={() => setShowSettle(false)}
          onSaved={fetchData}
        />
      )}
    </div>
  )
}
