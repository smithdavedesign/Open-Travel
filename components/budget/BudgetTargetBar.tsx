import type { ExpenseCategory } from '@/types'

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  flights: 'Flights',
  accommodation: 'Accommodation',
  food: 'Food & Drink',
  activities: 'Activities',
  transport: 'Transport',
  misc: 'Misc',
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  flights: 'bg-blue-500',
  accommodation: 'bg-purple-500',
  food: 'bg-orange-400',
  activities: 'bg-green-500',
  transport: 'bg-yellow-500',
  misc: 'bg-slate-400',
}

interface Props {
  budget: number
  spent: number
  currency: string
  categoryTotals: Partial<Record<ExpenseCategory, number>>
}

export default function BudgetTargetBar({ budget, spent, currency, categoryTotals }: Props) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

  const pct = Math.min((spent / budget) * 100, 100)
  const remaining = budget - spent
  const overBudget = spent > budget

  return (
    <div className="space-y-4">
      {/* Total progress */}
      <div>
        <div className="flex justify-between text-sm mb-1.5">
          <span className="font-medium text-slate-700">
            {fmt(spent)} <span className="text-slate-400 font-normal">of {fmt(budget)}</span>
          </span>
          <span className={`font-medium ${overBudget ? 'text-red-500' : 'text-slate-500'}`}>
            {overBudget ? `${fmt(Math.abs(remaining))} over` : `${fmt(remaining)} left`}
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${overBudget ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">{pct.toFixed(0)}% used</p>
      </div>

      {/* Per-category breakdown */}
      {Object.entries(categoryTotals).filter(([, v]) => v > 0).length > 0 && (
        <div className="space-y-2 pt-1 border-t border-slate-100">
          {(Object.entries(categoryTotals) as [ExpenseCategory, number][])
            .filter(([, v]) => v > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, amount]) => {
              const catPct = Math.min((amount / budget) * 100, 100)
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{CATEGORY_LABELS[cat]}</span>
                    <span className="font-medium text-slate-700">{fmt(amount)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${CATEGORY_COLORS[cat]}`}
                      style={{ width: `${catPct}%` }}
                    />
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
