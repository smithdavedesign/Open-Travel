'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { EventType } from '@/types'

const EVENT_TYPES: { value: EventType; label: string; icon: string }[] = [
  { value: 'flight',     label: 'Flight',      icon: '✈️' },
  { value: 'hotel',      label: 'Hotel',       icon: '🏨' },
  { value: 'car_rental', label: 'Car Rental',  icon: '🚗' },
  { value: 'activity',   label: 'Activity',    icon: '🎯' },
  { value: 'excursion',  label: 'Excursion',   icon: '🗺️' },
  { value: 'restaurant', label: 'Restaurant',  icon: '🍽️' },
  { value: 'transfer',   label: 'Transfer',    icon: '🚌' },
  { value: 'custom',     label: 'Custom',      icon: '📌' },
]

const empty = {
  type: 'custom' as EventType,
  title: '',
  date: '',
  start_time: '',
  end_time: '',
  location: '',
  confirmation_code: '',
  cost: '',
  currency: 'USD',
  notes: '',
}

export default function AddEventModal({ tripId }: { tripId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(empty)

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          type: form.type,
          title: form.title,
          date: form.date,
          start_time: form.start_time || null,
          end_time: form.end_time || null,
          location: form.location || null,
          confirmation_code: form.confirmation_code || null,
          cost: form.cost ? parseFloat(form.cost) : null,
          currency: form.currency,
          notes: form.notes || null,
          data: {},
        }),
      })
      if (!res.ok) throw new Error('Failed to add event')
      setForm(empty)
      setOpen(false)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ Add Event</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add an event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Event type selector */}
          <div className="space-y-1">
            <Label>Event type *</Label>
            <div className="grid grid-cols-4 gap-2">
              {EVENT_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs font-medium transition-colors ${
                    form.type === t.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="text-lg">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" placeholder="e.g. Flight to Paris" value={form.title} onChange={set('title')} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" value={form.date} onChange={set('date')} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="City or address" value={form.location} onChange={set('location')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="start_time">Start time</Label>
              <Input id="start_time" type="time" value={form.start_time} onChange={set('start_time')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end_time">End time</Label>
              <Input id="end_time" type="time" value={form.end_time} onChange={set('end_time')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="confirmation_code">Confirmation code</Label>
              <Input id="confirmation_code" placeholder="ABC123" value={form.confirmation_code} onChange={set('confirmation_code')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cost">Cost</Label>
              <div className="flex gap-1">
                <select
                  value={form.currency}
                  onChange={set('currency')}
                  className="rounded-md border border-input bg-background px-2 text-sm"
                >
                  {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <Input id="cost" type="number" step="0.01" min="0" placeholder="0.00" value={form.cost} onChange={set('cost')} />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Any additional details…" rows={2} value={form.notes} onChange={set('notes')} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Adding…' : 'Add event'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
