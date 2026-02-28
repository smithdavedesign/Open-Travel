'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { TripMember, ExpenseCategory, SplitMode } from '@/types'

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'flights', label: '✈️ Flights' },
  { value: 'accommodation', label: '🏨 Accommodation' },
  { value: 'food', label: '🍽️ Food & Drink' },
  { value: 'activities', label: '🎯 Activities' },
  { value: 'transport', label: '🚌 Transport' },
  { value: 'misc', label: '📎 Misc' },
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']

const SPLIT_MODES: { value: SplitMode; label: string; hint: string }[] = [
  { value: 'equal',      label: 'Equal',      hint: 'Divide evenly' },
  { value: 'exact',      label: 'Exact',      hint: 'Enter amounts' },
  { value: 'percentage', label: '%',           hint: 'Enter percents' },
  { value: 'shares',     label: 'Shares',     hint: 'Ratio-based' },
]

interface Props {
  tripId: string
  members: TripMember[]
  currentUserId: string
  onClose: () => void
  onSaved: () => void
}

function memberName(m: TripMember) {
  return m.profiles?.full_name ?? m.profiles?.email ?? m.user_id.slice(0, 8)
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

  // Split state
  const [splitMode, setSplitMode] = useState<SplitMode>('equal')
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    members.map(m => m.user_id)
  )
  // splitValues[userId] = exact $ | percentage | shares depending on mode
  const [splitValues, setSplitValues] = useState<Record<string, string>>({})

  const total = parseFloat(form.amount) || 0

  // Reset splitValues when mode or selected members change
  useEffect(() => {
    const defaults: Record<string, string> = {}
    selectedMembers.forEach(id => {
      if (splitMode === 'shares') defaults[id] = '1'
      else if (splitMode === 'percentage') {
        defaults[id] = selectedMembers.length
          ? (100 / selectedMembers.length).toFixed(1)
          : '0'
      } else {
        defaults[id] = ''
      }
    })
    setSplitValues(defaults)
  }, [splitMode, selectedMembers.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const setSplitValue = (userId: string, val: string) => {
    setSplitValues(prev => ({ ...prev, [userId]: val }))
  }

  // Validation helpers
  const sumExact = selectedMembers.reduce((s, id) => s + (parseFloat(splitValues[id] ?? '0') || 0), 0)
  const sumPct   = selectedMembers.reduce((s, id) => s + (parseFloat(splitValues[id] ?? '0') || 0), 0)
  const totalShares = selectedMembers.reduce((s, id) => s + (parseFloat(splitValues[id] ?? '0') || 0), 0)

  const splitError = (() => {
    if (splitMode === 'exact' && total > 0 && Math.abs(sumExact - total) > 0.02)
      return `Amounts must sum to ${total.toFixed(2)} (currently ${sumExact.toFixed(2)})`
    if (splitMode === 'percentage' && Math.abs(sumPct - 100) > 0.1)
      return `Percentages must sum to 100% (currently ${sumPct.toFixed(1)}%)`
    return null
  })()

  // Preview per-member amounts
  const previewAmount = (userId: string): string => {
    const val = parseFloat(splitValues[userId] ?? '0') || 0
    let amt = 0
    if (splitMode === 'equal') amt = total / (selectedMembers.length || 1)
    else if (splitMode === 'exact') amt = val
    else if (splitMode === 'percentage') amt = (total * val) / 100
    else if (splitMode === 'shares') amt = totalShares > 0 ? (total * val) / totalShares : 0
    return amt.toFixed(2)
  }

  const canSave =
    form.title &&
    form.amount &&
    selectedMembers.length > 0 &&
    !splitError

  const handleSave = async () => {
    if (!canSave) return
    setError('')
    setSaving(true)
    try {
      // Build numeric splitValues map to send
      const numericValues: Record<string, number> = {}
      selectedMembers.forEach(id => {
        numericValues[id] = parseFloat(splitValues[id] ?? '0') || 0
      })

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
          splitMode,
          splitValues: splitMode === 'equal' ? undefined : numericValues,
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
          {/* Description */}
          <div className="space-y-1">
            <Label>Description *</Label>
            <Input placeholder="e.g. Dinner at Hawksmoor" value={form.title} onChange={set('title')} />
          </div>

          {/* Amount + Date */}
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

          {/* Category + Paid by */}
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
                  <option key={m.user_id} value={m.user_id}>{memberName(m)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Split section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Split</Label>
              {/* Mode tabs */}
              <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
                {SPLIT_MODES.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    title={m.hint}
                    onClick={() => setSplitMode(m.value)}
                    className={`px-3 py-1 transition-colors ${
                      splitMode === m.value
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Equal mode: chip toggles + "X each" preview */}
            {splitMode === 'equal' && (
              <>
                <div className="flex flex-wrap gap-2">
                  {members.map(m => {
                    const selected = selectedMembers.includes(m.user_id)
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
                        {memberName(m)}
                      </button>
                    )
                  })}
                </div>
                {selectedMembers.length > 0 && total > 0 && (
                  <p className="text-xs text-slate-400">
                    {(total / selectedMembers.length).toFixed(2)} {form.currency} each
                    ({selectedMembers.length} {selectedMembers.length === 1 ? 'person' : 'people'})
                  </p>
                )}
              </>
            )}

            {/* Exact / Percentage / Shares: per-member row inputs */}
            {splitMode !== 'equal' && (
              <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50 p-3">
                {members.map(m => {
                  const included = selectedMembers.includes(m.user_id)
                  const placeholder =
                    splitMode === 'exact' ? '0.00'
                    : splitMode === 'percentage' ? '0'
                    : '1'
                  const suffix =
                    splitMode === 'percentage' ? '%'
                    : splitMode === 'shares' ? ' shares'
                    : ` ${form.currency}`

                  return (
                    <div key={m.user_id} className="flex items-center gap-2">
                      {/* Include/exclude toggle */}
                      <button
                        type="button"
                        onClick={() => toggleMember(m.user_id)}
                        className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          included
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-300 text-transparent'
                        }`}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>

                      <span className="text-sm text-slate-700 w-24 truncate">{memberName(m)}</span>

                      {included ? (
                        <>
                          <input
                            type="number"
                            step={splitMode === 'shares' ? '1' : '0.01'}
                            min="0"
                            placeholder={placeholder}
                            value={splitValues[m.user_id] ?? ''}
                            onChange={e => setSplitValue(m.user_id, e.target.value)}
                            className="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-xs text-slate-400 w-10 shrink-0">{suffix}</span>
                          {splitMode !== 'exact' && total > 0 && (
                            <span className="text-xs text-slate-500 w-14 text-right shrink-0">
                              = {previewAmount(m.user_id)} {form.currency}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 ml-1">excluded</span>
                      )}
                    </div>
                  )
                })}

                {/* Summary row */}
                <div className="pt-1 mt-1 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  {splitMode === 'exact' && (
                    <>
                      <span>Sum: {sumExact.toFixed(2)} {form.currency}</span>
                      <span>Total: {total.toFixed(2)} {form.currency}</span>
                    </>
                  )}
                  {splitMode === 'percentage' && (
                    <>
                      <span>Sum: {sumPct.toFixed(1)}%</span>
                      <span className={Math.abs(sumPct - 100) > 0.1 ? 'text-red-500' : 'text-green-600'}>
                        {Math.abs(sumPct - 100) < 0.1 ? '✓ 100%' : 'Must equal 100%'}
                      </span>
                    </>
                  )}
                  {splitMode === 'shares' && (
                    <>
                      <span>{totalShares} total shares</span>
                      <span>
                        {selectedMembers.map(id => {
                          const shares = parseFloat(splitValues[id] ?? '0') || 0
                          return shares > 0 ? `${previewAmount(id)}` : null
                        }).filter(Boolean).join(' / ')} {form.currency}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {splitError && (
              <p className="text-xs text-red-500">{splitError}</p>
            )}
          </div>

          {/* Notes */}
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
            disabled={saving || !canSave}
          >
            {saving ? 'Saving…' : 'Add expense'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
