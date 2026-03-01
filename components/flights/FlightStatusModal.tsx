'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Plane,
  PlaneTakeoff,
  PlaneLanding,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import type { FlightStatusData } from '@/lib/aviationstack/client'
import type { Event, FlightData } from '@/types'

interface Props {
  event: Event
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-800' },
  active:    { label: 'In Flight', className: 'bg-green-100 text-green-800' },
  landed:    { label: 'Landed',    className: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
  incident:  { label: 'Incident',  className: 'bg-red-100 text-red-800' },
  diverted:  { label: 'Diverted',  className: 'bg-amber-100 text-amber-800' },
  unknown:   { label: 'Unknown',   className: 'bg-gray-100 text-gray-800' },
}

function formatDateTime(dt: string | null): string | null {
  if (!dt) return null
  try {
    return new Date(dt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return dt
  }
}

function DelayBadge({ minutes }: { minutes: number | null }) {
  if (!minutes || minutes <= 0) return null
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const label = hours > 0 ? `${hours}h ${mins}m delay` : `${mins}m delay`
  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">
      <AlertTriangle className="h-3 w-3" />
      {label}
    </span>
  )
}

function TimeRow({
  label,
  icon: Icon,
  airport,
  iata,
  terminal,
  gate,
  scheduled,
  estimated,
  actual,
  delay,
}: {
  label: string
  icon: React.ElementType
  airport: string
  iata: string
  terminal: string | null
  gate: string | null
  scheduled: string | null
  estimated: string | null
  actual: string | null
  delay: number | null
}) {
  const displayTime = actual ?? estimated ?? scheduled
  return (
    <div className="rounded-lg border p-3 space-y-1.5">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </div>
      <p className="text-sm font-semibold">
        {airport} {iata ? `(${iata})` : ''}
      </p>
      {displayTime && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDateTime(displayTime)}
          {actual && scheduled && actual !== scheduled && (
            <span className="line-through ml-1 text-xs">
              {formatDateTime(scheduled)}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {terminal && <span>Terminal {terminal}</span>}
        {gate && <span>Gate {gate}</span>}
      </div>
      <DelayBadge minutes={delay} />
    </div>
  )
}

export default function FlightStatusModal({ event, open, onOpenChange }: Props) {
  const [status, setStatus] = useState<FlightStatusData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const flightData = event.data as unknown as FlightData | undefined
  const flightNumber = flightData?.flight_number ?? ''

  async function lookupStatus() {
    if (!flightNumber) {
      setError('No flight number available')
      return
    }
    setLoading(true)
    setError(null)
    setStatus(null)

    try {
      const res = await fetch(
        `/api/flight-status?flight=${encodeURIComponent(flightNumber)}`
      )
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? 'Failed to fetch flight status')
      }
      const data: FlightStatusData = await res.json()
      setStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen && !status && !loading) {
      lookupStatus()
    }
    if (!nextOpen) {
      setStatus(null)
      setError(null)
    }
    onOpenChange(nextOpen)
  }

  const statusCfg = STATUS_CONFIG[status?.status ?? ''] ?? STATUS_CONFIG.unknown

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-blue-500" />
            Flight Status
          </DialogTitle>
          <DialogDescription>
            {flightNumber
              ? `Live status for flight ${flightNumber}`
              : 'Flight status lookup'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Looking up flight status…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
              <AlertTriangle className="h-5 w-5 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive">{error}</p>
              <button
                onClick={lookupStatus}
                className="mt-3 text-sm underline text-muted-foreground hover:text-foreground"
              >
                Try again
              </button>
            </div>
          )}

          {/* Result */}
          {status && (
            <>
              {/* Flight header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-base">
                    {status.airline_name} · {status.flight_iata}
                  </p>
                </div>
                <Badge className={statusCfg.className} aria-label={`Flight status: ${statusCfg.label}`}>
                  {statusCfg.label}
                </Badge>
              </div>

              {/* Departure / Arrival */}
              <div className="grid gap-3">
                <TimeRow
                  label="Departure"
                  icon={PlaneTakeoff}
                  {...status.departure}
                />
                <TimeRow
                  label="Arrival"
                  icon={PlaneLanding}
                  {...status.arrival}
                />
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
