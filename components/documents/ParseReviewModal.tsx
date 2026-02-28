'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { Document, ParsedEventData, EventType } from '@/types'

const TYPE_ICONS: Record<EventType, string> = {
  flight: '✈️', hotel: '🏨', car_rental: '🚗', activity: '🎯',
  excursion: '🗺️', restaurant: '🍽️', transfer: '🚌', custom: '📌',
}

interface Props {
  document: Document
  parsed: ParsedEventData
  requiresReview: boolean
  tripId: string
  onClose: () => void
}

export default function ParseReviewModal({ document, parsed, requiresReview, tripId, onClose }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    type: parsed.type,
    title: parsed.title ?? '',
    date: parsed.date ?? '',
    start_time: parsed.start_time ?? '',
    end_time: parsed.end_time ?? '',
    location: parsed.location ?? '',
    confirmation_code: parsed.confirmation_code ?? '',
    cost: parsed.cost?.toString() ?? '',
    currency: parsed.currency ?? 'USD',
    notes: parsed.notes ?? '',
  })

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSave = async () => {
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/parse-document/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          tripId,
          parsed: {
            ...form,
            cost: form.cost ? parseFloat(form.cost) : null,
            start_time: form.start_time || null,
            end_time: form.end_time || null,
            location: form.location || null,
            confirmation_code: form.confirmation_code || null,
            notes: form.notes || null,
            data: parsed.data,
            confidence: parsed.confidence,
          },
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to save event')
      }
      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const confidence = Math.round((parsed.confidence ?? 0) * 100)

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {TYPE_ICONS[form.type]} Review parsed booking
          </DialogTitle>
        </DialogHeader>

        <div className={`rounded-lg px-3 py-2 text-xs font-medium mb-2 ${
          confidence >= 85 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
        }`}>
          {confidence >= 85
            ? `✓ High confidence parse (${confidence}%) — review and save`
            : `⚠ Lower confidence (${confidence}%) — please review carefully`}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Type</Label>
              <select value={form.type} onChange={set('type')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {Object.entries(TYPE_ICONS).map(([v, icon]) => (
                  <option key={v} value={v}>{icon} {v.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={set('date')} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Title *</Label>
            <Input value={form.title} onChange={set('title')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Start time</Label>
              <Input type="time" value={form.start_time} onChange={set('start_time')} />
            </div>
            <div className="space-y-1">
              <Label>End time</Label>
              <Input type="time" value={form.end_time} onChange={set('end_time')} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Location</Label>
            <Input value={form.location} onChange={set('location')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Confirmation code</Label>
              <Input value={form.confirmation_code} onChange={set('confirmation_code')} />
            </div>
            <div className="space-y-1">
              <Label>Cost</Label>
              <div className="flex gap-1">
                <select value={form.currency} onChange={set('currency')}
                  className="rounded-md border border-input bg-background px-2 text-sm">
                  {['USD','EUR','GBP','CAD','AUD','JPY'].map(c => <option key={c}>{c}</option>)}
                </select>
                <Input type="number" step="0.01" min="0" value={form.cost} onChange={set('cost')} />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={set('notes')} />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-between gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Dismiss</Button>
          <Button onClick={handleSave} disabled={saving || !form.title || !form.date}>
            {saving ? 'Saving…' : 'Save as Event'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
