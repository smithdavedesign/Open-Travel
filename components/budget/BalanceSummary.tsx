import type { Balance, TripMember } from '@/types'

function memberName(members: TripMember[], userId: string): string {
  const m = members.find(m => m.user_id === userId)
  return m?.profiles?.full_name ?? m?.profiles?.email ?? userId.slice(0, 8)
}

interface Props {
  balances: Record<string, Balance>
  members: TripMember[]
  currency: string
}

export default function BalanceSummary({ balances, members, currency }: Props) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Math.abs(n))

  const entries = Object.values(balances)

  if (entries.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-4">No balances to show.</p>
  }

  return (
    <div className="space-y-2">
      {entries.map(b => {
        const name = memberName(members, b.userId)
        const isOwed = b.net > 0
        const isEven = Math.abs(b.net) < 0.01

        return (
          <div key={b.userId} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <span className="text-sm text-slate-700">{name}</span>
            {isEven ? (
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Settled up</span>
            ) : (
              <span className={`text-sm font-medium ${isOwed ? 'text-green-600' : 'text-red-500'}`}>
                {isOwed ? `gets back ${fmt(b.net)}` : `owes ${fmt(b.net)}`}
              </span>
            )}
          </div>
        )
      })}

      {/* Breakdown of who owes whom */}
      {entries.some(b => Object.keys(b.owes).length > 0) && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-2">Breakdown</p>
          {entries.flatMap(b =>
            Object.entries(b.owes)
              .filter(([, amt]) => amt > 0.01)
              .map(([toId, amt]) => (
                <p key={`${b.userId}-${toId}`} className="text-xs text-slate-500 py-0.5">
                  <span className="font-medium text-slate-700">{memberName(members, b.userId)}</span>
                  {' owes '}
                  <span className="font-medium text-slate-700">{memberName(members, toId)}</span>
                  {' '}
                  <span className="text-slate-900">{fmt(amt)} {currency}</span>
                </p>
              ))
          )}
        </div>
      )}
    </div>
  )
}
