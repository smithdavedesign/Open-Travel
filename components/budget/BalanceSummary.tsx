import type { Balance, TripMember } from '@/types'
import { Button } from '@/components/ui/button'

function memberName(members: TripMember[], userId: string): string {
  const m = members.find(m => m.user_id === userId)
  return m?.profiles?.full_name ?? m?.profiles?.email ?? userId.slice(0, 8)
}

interface Props {
  balances: Record<string, Balance>
  members: TripMember[]
  currency: string
  onSettle?: () => void
}

export default function BalanceSummary({ balances, members, currency, onSettle }: Props) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Math.abs(n))

  // Build a flat list of "X owes Y $amt" debts from the owes map
  const debts = Object.values(balances).flatMap(b =>
    Object.entries(b.owes)
      .filter(([, amt]) => amt > 0.01)
      .map(([toId, amt]) => ({
        fromId: b.userId,
        toId,
        amt,
        key: `${b.userId}-${toId}`,
      }))
  )

  if (debts.length === 0) {
    const hasBalances = Object.keys(balances).length > 0
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        {hasBalances ? 'All settled up!' : 'No balances yet.'}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {debts.map(({ fromId, toId, amt, key }) => (
        <div key={key} className="flex items-center justify-between gap-3 py-2.5 border-b last:border-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0 uppercase">
              {memberName(members, fromId)[0]}
            </div>
            <p className="text-sm text-foreground min-w-0 truncate">
              <span className="font-medium">{memberName(members, fromId)}</span>
              <span className="text-muted-foreground"> owes </span>
              <span className="font-medium">{memberName(members, toId)}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-semibold text-foreground">{fmt(amt)}</span>
            {onSettle && (
              <Button size="sm" variant="outline" onClick={onSettle} className="h-7 text-xs px-2">
                Settle
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
