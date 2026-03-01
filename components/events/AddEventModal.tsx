'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2, Paperclip, CheckCircle2, Radar, X } from 'lucide-react'
import type { Event, EventType, FlightData, ParsedEventData } from '@/types'
import type { FlightStatusData } from '@/lib/aviationstack/client'

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
  flight_number: '',
  origin: '',
  destination: '',
  cost: '',
  currency: 'USD',
  notes: '',
}

// Extract HH:MM from an ISO timestamp string (e.g. "2026-03-29T22:56:00+00:00")
function isoToTime(iso: string | null): string {
  if (!iso) return ''
  const m = iso.match(/T(\d{2}:\d{2})/)
  return m ? m[1] : ''
}

// Extract YYYY-MM-DD from an ISO timestamp string
function isoToDate(iso: string | null): string {
  if (!iso) return ''
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : ''
}

interface Props {
  tripId: string
  /** When provided, the modal is in edit mode and controlled externally */
  event?: Event
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function AddEventModal({ tripId, event: editEvent, open: controlledOpen, onOpenChange }: Props) {
  const router = useRouter()
  const isEditMode = Boolean(editEvent)
  const isControlled = controlledOpen !== undefined

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(empty)

  // Parse-from-file state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parsing, setParsing] = useState(false)
  const [parsedFrom, setParsedFrom] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  // Flight look-up state
  const [lookingUpFlight, setLookingUpFlight] = useState(false)
  const [flightLookupError, setFlightLookupError] = useState<string | null>(null)
  const [flightFilled, setFlightFilled] = useState(false)

  // Sync form when editing event changes
  useEffect(() => {
    if (editEvent) {
      setForm({
        type: editEvent.type,
        title: editEvent.title,
        date: editEvent.date,
        start_time: editEvent.start_time ?? '',
        end_time: editEvent.end_time ?? '',
        location: editEvent.location ?? '',
        confirmation_code: editEvent.confirmation_code ?? '',
        flight_number: (editEvent.data as unknown as FlightData)?.flight_number ?? '',
        origin:        (editEvent.data as unknown as FlightData)?.origin ?? '',
        destination:   (editEvent.data as unknown as FlightData)?.destination ?? '',
        cost: editEvent.cost != null ? String(editEvent.cost) : '',
        currency: editEvent.currency,
        notes: editEvent.notes ?? '',
      })
    } else {
      setForm(empty)
    }
  }, [editEvent])

  const modalOpen = isControlled ? controlledOpen! : open
  const setModalOpen = isControlled ? onOpenChange! : setOpen

  function handleClose() {
    setModalOpen(false)
    setParsedFrom(null)
    setParseError(null)
    setFlightLookupError(null)
    setFlightFilled(false)
  }

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  // ── Parse from booking document ────────────────────────────────────────────

  async function handleParseFile(file: File) {
    setParsing(true)
    setParsedFrom(null)
    setParseError(null)

    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/parse-event', { method: 'POST', body: fd })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? 'Parse failed')
      }
      const parsed: ParsedEventData = await res.json()

      setForm({
        type: parsed.type ?? form.type,
        title: parsed.title ?? '',
        date: parsed.date ?? '',
        start_time: parsed.start_time ?? '',
        end_time: parsed.end_time ?? '',
        location: parsed.location ?? '',
        confirmation_code: parsed.confirmation_code ?? '',
        flight_number: (parsed.data as unknown as FlightData)?.flight_number ?? '',
        origin:        (parsed.data as unknown as FlightData)?.origin ?? '',
        destination:   (parsed.data as unknown as FlightData)?.destination ?? '',
        cost: parsed.cost != null ? String(parsed.cost) : '',
        currency: parsed.currency ?? 'USD',
        notes: parsed.notes ?? '',
      })
      setParsedFrom(file.name)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Could not parse document. Fill in manually.')
    } finally {
      setParsing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Flight number look-up ──────────────────────────────────────────────────

  async function lookupFlight() {
    const fn = form.flight_number.trim()
    if (!fn) return
    setLookingUpFlight(true)
    setFlightLookupError(null)
    setFlightFilled(false)

    try {
      const res = await fetch(`/api/flight-status?flight=${encodeURIComponent(fn)}`)
      if (!res.ok) throw new Error('Flight not found')
      const status: FlightStatusData = await res.json()

      setForm(f => ({
        ...f,
        title:       `${status.airline_name} · ${status.flight_iata}`,
        origin:      `${status.departure.airport} (${status.departure.iata})`,
        destination: `${status.arrival.airport} (${status.arrival.iata})`,
        location:    `${status.arrival.airport} (${status.arrival.iata})`,
        date:        isoToDate(status.departure.scheduled) || f.date,
        start_time:  isoToTime(status.departure.scheduled) || f.start_time,
        end_time:    isoToTime(status.arrival.scheduled)   || f.end_time,
      }))
      setFlightFilled(true)
    } catch {
      setFlightLookupError('Flight not found. Enter a current flight or fill in manually.')
    } finally {
      setLookingUpFlight(false)
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
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
        data: form.type === 'flight'
          ? {
              ...(editEvent?.data ?? {}),
              flight_number: form.flight_number || null,
              origin:        form.origin || null,
              destination:   form.destination || null,
            }
          : (editEvent?.data ?? {}),
      }

      const res = isEditMode
        ? await fetch(`/api/events/${editEvent!.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tripId, ...payload }),
          })

      if (!res.ok) throw new Error(isEditMode ? 'Failed to update event' : 'Failed to add event')
      if (!isEditMode) setForm(empty)
      handleClose()
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const dialogContent = (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{isEditMode ? 'Edit event' : 'Add an event'}</DialogTitle>
      </DialogHeader>

      {/* ── Parse from document ── */}
      <div className="rounded-lg border border-dashed bg-muted/30 px-3 py-2.5">
        {parsedFrom ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Auto-filled from <span className="font-medium">{parsedFrom}</span> — review and save</span>
            </div>
            <button onClick={() => setParsedFrom(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : parsing ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Parsing with AI…
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Have a booking confirmation?</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Paperclip className="h-3.5 w-3.5" />
              Parse from screenshot or PDF
            </button>
          </div>
        )}
        {parseError && (
          <p className="mt-1 text-xs text-destructive">{parseError}</p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleParseFile(f) }}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-border/80'
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

        {/* Flight number + look-up */}
        {form.type === 'flight' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="flight_number">Flight number</Label>
              <div className="flex gap-2">
                <Input
                  id="flight_number"
                  placeholder="e.g. AA100, UA1"
                  value={form.flight_number}
                  onChange={e => { set('flight_number')(e); setFlightFilled(false); setFlightLookupError(null) }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={lookupFlight}
                  disabled={!form.flight_number.trim() || lookingUpFlight}
                  className="shrink-0 gap-1.5"
                >
                  {lookingUpFlight
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Radar className="h-3.5 w-3.5" />
                  }
                  {flightFilled ? 'Re-lookup' : 'Look up'}
                </Button>
              </div>
              {flightFilled && (
                <p className="text-xs text-green-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Form filled from live flight data — edit as needed
                </p>
              )}
              {flightLookupError && (
                <p className="text-xs text-destructive">{flightLookupError}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="origin">From</Label>
                <Input id="origin" placeholder="e.g. New York (JFK)" value={form.origin} onChange={set('origin')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="destination">To</Label>
                <Input id="destination" placeholder="e.g. London (LHR)" value={form.destination} onChange={set('destination')} />
              </div>
            </div>
          </div>
        )}

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

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? (isEditMode ? 'Saving…' : 'Adding…') : (isEditMode ? 'Save changes' : 'Add event')}
          </Button>
        </div>
      </form>
    </DialogContent>
  )

  if (isControlled) {
    return (
      <Dialog open={modalOpen} onOpenChange={nextOpen => nextOpen ? setModalOpen(nextOpen) : handleClose()}>
        {dialogContent}
      </Dialog>
    )
  }

  return (
    <Dialog open={modalOpen} onOpenChange={nextOpen => nextOpen ? setModalOpen(nextOpen) : handleClose()}>
      <DialogTrigger asChild>
        <Button size="sm">+ Add event</Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  )
}
