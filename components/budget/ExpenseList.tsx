import type { Expense, TripMember, ExpenseCategory } from '@/types'

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  flights: '✈️',
  accommodation: '🏨',
  food: '🍽️',
  activities: '🎯',
  transport: '🚌',
  misc: '📎',
}

function memberName(members: TripMember[], userId: string): string {
  const m = members.find(m => m.user_id === userId)
  return m?.profiles?.full_name ?? m?.profiles?.email ?? userId.slice(0, 8)
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
}

interface Props {
  expenses: Expense[]
  members: TripMember[]
  currentUserId: string
  onDelete: (expenseId: string) => void
}

export default function ExpenseList({ expenses, members, currentUserId, onDelete }: Props) {
  if (expenses.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">No expenses yet.</p>
  }

  return (
    <ul className="divide-y divide-slate-100">
      {expenses.map(exp => (
        <li key={exp.id} className="flex items-center gap-3 py-3">
          <span className="text-xl shrink-0">{CATEGORY_ICONS[exp.category]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{exp.title}</p>
            <p className="text-xs text-slate-400">
              {exp.date} · paid by {memberName(members, exp.paid_by)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold text-slate-900">
              {formatAmount(exp.amount, exp.currency)}
            </p>
            {exp.paid_by === currentUserId && (
              <button
                onClick={() => onDelete(exp.id)}
                className="text-xs text-red-400 hover:text-red-600 mt-0.5"
              >
                Delete
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
