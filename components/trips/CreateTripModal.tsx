'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const emptyForm = {
  name: '',
  destinations: '',
  start_date: '',
  end_date: '',
  description: '',
}

export default function CreateTripModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          destinations: form.destinations.split(',').map(d => d.trim()).filter(Boolean),
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          description: form.description || null,
          cover_photo_url: null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Server error ${res.status}`)
      }
      setForm(emptyForm)
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ New Trip</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new trip</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="name">Trip name *</Label>
            <Input id="name" placeholder="Barcelona with friends" value={form.name} onChange={set('name')} required />
          </div>

          <div className="space-y-1">
            <Label htmlFor="destinations">Destinations</Label>
            <Input id="destinations" placeholder="Paris, Rome, Barcelona" value={form.destinations} onChange={set('destinations')} />
            <p className="text-xs text-slate-400">Separate multiple destinations with commas</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="start_date">Start date</Label>
              <Input id="start_date" type="date" value={form.start_date} onChange={set('start_date')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end_date">End date</Label>
              <Input id="end_date" type="date" value={form.end_date} onChange={set('end_date')} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="What's this trip about?" rows={2} value={form.description} onChange={set('description')} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create trip'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
