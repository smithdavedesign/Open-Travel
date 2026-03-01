'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Plane, Hotel, UtensilsCrossed, Zap, Car, MoreHorizontal } from 'lucide-react'
import AddExpenseModal from '@/components/budget/AddExpenseModal'
import ExportPDFButton from '@/components/trips/ExportPDFButton'
import ExpenseList from '@/components/budget/ExpenseList'
import BalanceSummary from '@/components/budget/BalanceSummary'
import RecordSettlementModal from '@/components/budget/RecordSettlementModal'
import type { Expense, TripMember, Balance, Settlement, Trip, ExpenseCategory } from '@/types'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']

const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  flights:       { label: 'Flights',        color: 'bg-blue-500',   bg: 'bg-blue-50',   icon: Plane },
  accommodation: { label: 'Accommodation',  color: 'bg-purple-500', bg: 'bg-purple-50', icon: Hotel },
  food:          { label: 'Food & Dining',  color: 'bg-orange-400', bg: 'bg-orange-50', icon: UtensilsCrossed },
  activities:    { label: 'Activities',     color: 'bg-green-500',  bg: 'bg-green-50',  icon: Zap },
  transport:     { label: 'Transportation', color: 'bg-yellow-500', bg: 'bg-yellow-50', icon: Car },
  misc:          { label: 'Misc',           color: 'bg-slate-400',  bg: 'bg-slate-50',  icon: MoreHorizontal },
}

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
      tripRes.json(), membersRes.json(), expensesRes.json(), balancesRes.json(), settlementsRes.json(),
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
      body: JSON.stringify({ budget: parseFloat(budgetInput), budget_currency: budgetCurrency }),
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

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: primaryCurrency, maximumFractionDigits: 0 }).format(n)

  const categoryTotals = expenses.reduce<Partial<Record<ExpenseCategory, number>>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {})

  const budget = trip?.budget ?? 0
  const remaining = budget - total
  const overBudget = budget > 0 && total > budget
  const pct = budget > 0 ? Math.min((total / budget) * 100, 100) : 0

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Budget & Expenses</h1>
          <p className="text-muted-foreground text-sm">Track spending and settle expenses with your group</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportPDFButton tripId={tripId} />
          {hasBalances && !allSettled && (
            <Button variant="outline" onClick={() => setShowSettle(true)}>Settle up</Button>
          )}
          <Button onClick={() => setShowAdd(true)} className="gap-2">+ Add Expense</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-16">Loading…</p>
      ) : (
        <>
          {/* Gradient overview card — Figma style */}
          <div className="rounded-xl bg-gradient-to-br from-primary to-sky-700 text-white p-6 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
              <div>
                <p className="text-sm opacity-90 mb-1">Total Budget</p>
                {editingBudget ? (
                  <div className="flex gap-2 items-center mt-1">
                    <select
                      value={budgetCurrency}
                      onChange={e => setBudgetCurrency(e.target.value)}
                      className="rounded-md bg-white/20 border border-white/30 text-white px-2 py-1 text-sm"
                    >
                      {CURRENCIES.map(c => <option key={c} className="text-black">{c}</option>)}
                    </select>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                      value={budgetInput}
                      onChange={e => setBudgetInput(e.target.value)}
                      className="w-28 bg-white/20 border-white/30 text-white placeholder:text-white/60 h-8"
                    />
                    <Button size="sm" onClick={handleSaveBudget} disabled={savingBudget} className="bg-white text-primary hover:bg-white/90 h-8">
                      {savingBudget ? '…' : 'Save'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingBudget(false)} className="text-white hover:bg-white/20 h-8">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">{budget > 0 ? fmt(budget) : '—'}</p>
                    {canEdit && (
                      <button
                        onClick={() => { setBudgetInput(trip?.budget?.toString() ?? ''); setBudgetCurrency(trip?.budget_currency ?? 'USD'); setEditingBudget(true) }}
                        className="text-xs opacity-70 hover:opacity-100 underline"
                      >
                        {budget > 0 ? 'Edit' : 'Set budget'}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm opacity-90 mb-1">Total Spent</p>
                <p className="text-3xl font-bold">{fmt(total)}</p>
              </div>
              <div>
                <p className="text-sm opacity-90 mb-1">Remaining</p>
                <p className={`text-3xl font-bold ${overBudget ? 'text-red-300' : ''}`}>
                  {budget > 0 ? (overBudget ? `−${fmt(Math.abs(remaining))}` : fmt(remaining)) : '—'}
                </p>
              </div>
            </div>
            {budget > 0 && (
              <div>
                <Progress value={pct} className="h-2 bg-white/20 [&>div]:bg-white" />
                <p className="text-sm mt-1.5 opacity-80">{pct.toFixed(0)}% of budget used</p>
              </div>
            )}
          </div>

          {/* Tabs: Categories / Balances / Expenses */}
          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="grid w-full max-w-sm grid-cols-3">
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="balances">Balances</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>

            {/* Categories tab */}
            <TabsContent value="categories" className="mt-6">
              {Object.keys(categoryTotals).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No expenses yet — add one to see the breakdown.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(Object.entries(categoryTotals) as [ExpenseCategory, number][])
                    .filter(([, v]) => v > 0)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, amount]) => {
                      const cfg = CATEGORY_CONFIG[cat]
                      const catPct = budget > 0 ? Math.min((amount / budget) * 100, 100) : 0
                      const txCount = expenses.filter(e => e.category === cat).length
                      return (
                        <div key={cat} className="bg-card rounded-xl border p-5 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`${cfg.color} rounded-lg p-2 flex items-center justify-center`}>
                                <cfg.icon className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{cfg.label}</p>
                                <p className="text-xs text-muted-foreground">{txCount} transaction{txCount !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${budget > 0 && amount > budget ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {budget > 0 && amount > budget ? 'Over' : 'On Track'}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Spent</span>
                              <span className="font-semibold">{fmt(amount)}</span>
                            </div>
                            <Progress value={catPct} className="h-1.5" />
                            {budget > 0 && (
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>of {fmt(budget)} budget</span>
                                <span className={amount > budget ? 'text-red-600' : 'text-green-600'}>
                                  {amount > budget ? `${fmt(amount - budget)} over` : `${fmt(budget - amount)} left`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </TabsContent>

            {/* Balances tab */}
            <TabsContent value="balances" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Who owes whom */}
                <div className="bg-card rounded-xl border p-5">
                  <h3 className="font-semibold mb-4">Who Owes Whom</h3>
                  {!hasBalances ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No balances yet.</p>
                  ) : allSettled ? (
                    <p className="text-sm text-green-600 font-medium text-center py-6">All settled up!</p>
                  ) : (
                    <BalanceSummary balances={balances} members={members} currency={primaryCurrency} onSettle={() => setShowSettle(true)} />
                  )}
                </div>

                {/* Record settlement */}
                <div className="bg-card rounded-xl border p-5">
                  <h3 className="font-semibold mb-4">Record Settlement</h3>
                  {settlements.length === 0 ? (
                    <p className="text-sm text-muted-foreground mb-4">No payments recorded yet.</p>
                  ) : (
                    <ul className="divide-y divide-border mb-4">
                      {settlements.map(s => (
                        <li key={s.id} className="py-2.5 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            <span className="font-medium text-foreground">{memberName(members, s.from_user_id)}</span>
                            {' paid '}
                            <span className="font-medium text-foreground">{memberName(members, s.to_user_id)}</span>
                            {s.method ? ` via ${s.method}` : ''}
                          </span>
                          <span className="font-semibold shrink-0 ml-3">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: s.currency, maximumFractionDigits: 2 }).format(s.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {hasBalances && !allSettled && currentUserId && (
                    <Button className="w-full" onClick={() => setShowSettle(true)}>Record Payment</Button>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Expenses tab */}
            <TabsContent value="expenses" className="mt-6">
              <div className="bg-card rounded-xl border p-5">
                <h3 className="font-semibold mb-4">All Expenses</h3>
                <ExpenseList
                  expenses={expenses}
                  members={members}
                  currentUserId={currentUserId ?? ''}
                  onDelete={handleDelete}
                />
              </div>
            </TabsContent>
          </Tabs>
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
