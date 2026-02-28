'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { TripMember, ExpenseCategory } from '@/types'

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'flights', label: '✈️ Flights' },
  { value: 'accommodation', label: '🏨 Accommodation' },
  { value: 'food', label: '🍽️ Food & Drink' },
  { value: 'activities', label: '🎯 Activities' },
  { value: 'transport', label: '🚌 Transport' },
  { value: 'misc', label: '📎 Misc' },
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']

interface Props {
  tripId: string
  members: TripMember[]
  currentUserId: string
  onClose: () => void
  onSaved: () => void
}

export default function AddExpenseModal({ tripId, members, currentUserId, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    amount: '',
    currency: 'USD',
    category: 'misc' as ExpenseCategory,
    paid_by: currentUserId,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    members.map(m => m.user_id)
  )

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const handleSave = async () => {
    if (!form.title || !form.amount || selectedMembers.length === 0) return
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          title: form.title,
          amount: parseFloat(form.amount),
          currency: form.currency,
          amount_home_currency: null,
          category: form.category,
          paid_by: form.paid_by,
          date: form.date,
          notes: form.notes || null,
          receipt_url: null,
          event_id: null,
          memberIds: selectedMembers,
          splitMode: 'equal',
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to save expense')
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add expense</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Description *</Label>
            <Input placeholder="e.g. Dinner at Hawksmoor" value={form.title} onChange={set('title')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Amount *</Label>
              <div className="flex gap-1">
                <select value={form.currency} onChange={set('currency')}
                  className="rounded-md border border-input bg-background px-2 text-sm">
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={set('amount')} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={set('date')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Category</Label>
              <select value={form.category} onChange={set('category')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Paid by</Label>
              <select value={form.paid_by} onChange={set('paid_by')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.profiles?.full_name ?? m.profiles?.email ?? m.user_id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Split between</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {members.map(m => {
                const selected = selectedMembers.includes(m.user_id)
                const name = m.profiles?.full_name ?? m.profiles?.email ?? m.user_id.slice(0, 8)
                return (
                  <button
                    key={m.user_id}
                    type="button"
                    onClick={() => toggleMember(m.user_id)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      selected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {name}
                  </button>
                )
              })}
            </div>
            {selectedMembers.length > 0 && form.amount && (
              <p className="text-xs text-slate-400 mt-1">
                {(parseFloat(form.amount) / selectedMembers.length).toFixed(2)} {form.currency} each
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea rows={2} placeholder="Optional notes…" value={form.notes} onChange={set('notes')} />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-between gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.title || !form.amount || selectedMembers.length === 0}
          >
            {saving ? 'Saving…' : 'Add expense'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
