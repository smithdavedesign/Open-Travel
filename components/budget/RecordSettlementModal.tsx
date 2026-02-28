'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { TripMember, Balance } from '@/types'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']
const METHODS = ['Cash', 'Venmo', 'PayPal', 'Zelle', 'Bank transfer', 'Other']

interface Props {
  tripId: string
  members: TripMember[]
  balances: Record<string, Balance>
  currentUserId: string
  onClose: () => void
  onSaved: () => void
}

export default function RecordSettlementModal({
  tripId, members, balances, currentUserId, onClose, onSaved,
}: Props) {
  const currentBalance = balances[currentUserId]
  const topCreditor = currentBalance
    ? Object.entries(currentBalance.owes).sort((a, b) => b[1] - a[1])[0]
    : null

  const [form, setForm] = useState({
    from_user_id: currentUserId,
    to_user_id: topCreditor?.[0] ?? (members.find(m => m.user_id !== currentUserId)?.user_id ?? ''),
    amount: topCreditor ? topCreditor[1].toFixed(2) : '',
    currency: 'USD',
    method: 'Cash',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  const memberName = (userId: string) => {
    const m = members.find(m => m.user_id === userId)
    return m?.profiles?.full_name ?? m?.profiles?.email ?? userId.slice(0, 8)
  }

  const handleSave = async () => {
    if (!form.from_user_id || !form.to_user_id || !form.amount) return
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/settlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_user_id: form.from_user_id,
          to_user_id: form.to_user_id,
          amount: parseFloat(form.amount),
          currency: form.currency,
          method: form.method,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to record settlement')
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const canSave = form.from_user_id && form.to_user_id &&
    form.from_user_id !== form.to_user_id && form.amount

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record settlement</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Paid by</Label>
            <select value={form.from_user_id} onChange={set('from_user_id')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>{memberName(m.user_id)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label>Paid to</Label>
            <select value={form.to_user_id} onChange={set('to_user_id')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {members
                .filter(m => m.user_id !== form.from_user_id)
                .map(m => (
                  <option key={m.user_id} value={m.user_id}>{memberName(m.user_id)}</option>
                ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label>Amount</Label>
            <div className="flex gap-1">
              <select value={form.currency} onChange={set('currency')}
                className="rounded-md border border-input bg-background px-2 text-sm">
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <Input type="number" step="0.01" min="0" placeholder="0.00"
                value={form.amount} onChange={set('amount')} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Method</Label>
            <select value={form.method} onChange={set('method')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-between gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !canSave}>
            {saving ? 'Saving…' : 'Record payment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
