'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { Trip } from '@/types'

interface Props {
  trip: Trip
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (updated: Trip) => void
}

export default function EditTripModal({ trip, open, onOpenChange, onSaved }: Props) {
  const [form, setForm] = useState({
    name: trip.name,
    destinations: trip.destinations.join(', '),
    start_date: trip.start_date ?? '',
    end_date: trip.end_date ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Trip name is required.')
      return
    }
    setError('')
    setSaving(true)
    try {
      const destinations = form.destinations
        .split(',')
        .map(d => d.trim())
        .filter(Boolean)

      const res = await fetch(`/api/trips/${trip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          destinations,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to update trip')
      }
      const updated = await res.json()
      onSaved(updated)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Trip Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-trip-name">Trip Name</Label>
            <Input
              id="edit-trip-name"
              value={form.name}
              onChange={set('name')}
              placeholder="My Trip"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-trip-destinations">Destinations</Label>
            <Input
              id="edit-trip-destinations"
              value={form.destinations}
              onChange={set('destinations')}
              placeholder="Paris, London, Rome"
            />
            <p className="text-xs text-muted-foreground">Separate multiple destinations with commas</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-trip-start">Start Date</Label>
              <Input
                id="edit-trip-start"
                type="date"
                value={form.start_date}
                onChange={set('start_date')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-trip-end">End Date</Label>
              <Input
                id="edit-trip-end"
                type="date"
                value={form.end_date}
                onChange={set('end_date')}
              />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-destructive mt-2">{error}</p>}

        <div className="flex justify-end gap-2 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
