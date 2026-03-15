'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  tripId: string
  initialName: string
  initialDestinations: string[]
  initialStartDate: string | null
  initialEndDate: string | null
}

export default function TripEditButton({ tripId, initialName, initialDestinations, initialStartDate, initialEndDate }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: initialName,
    destinations: initialDestinations.join(', '),
    start_date: initialStartDate ?? '',
    end_date: initialEndDate ?? '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const destinations = form.destinations.split(',').map(d => d.trim()).filter(Boolean)
    await fetch(`/api/trips/${tripId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        destinations,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      }),
    })
    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => {
          setForm({ name: initialName, destinations: initialDestinations.join(', '), start_date: initialStartDate ?? '', end_date: initialEndDate ?? '' })
          setOpen(true)
        }}
        className="hidden lg:flex items-center gap-1 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        title="Edit trip details"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit trip details</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Destinations <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
              <Input value={form.destinations} onChange={e => setForm(f => ({ ...f, destinations: e.target.value }))} placeholder="Paris, Rome, Barcelona" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Start date</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>End date</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
