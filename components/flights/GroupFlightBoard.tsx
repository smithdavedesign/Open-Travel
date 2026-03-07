'use client'

import { useState } from 'react'
import { Plane, PlaneTakeoff, PlaneLanding, Clock } from 'lucide-react'
import FlightStatusModal from '@/components/flights/FlightStatusModal'
import type { Event, FlightData, TripMember } from '@/types'

interface Props {
  flightEvents: Event[]
  members: TripMember[]
}

function formatTime(time: string | null): string {
  if (!time) return '—'
  try {
    return new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch {
    return time
  }
}

function formatDate(date: string): string {
  try {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  } catch {
    return date
  }
}

function MemberAvatar({ member }: { member: TripMember }) {
  const name = member.profiles?.full_name ?? member.profiles?.email ?? 'Member'
  const initial = name.charAt(0).toUpperCase()
  return (
    <div
      className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-semibold text-primary shrink-0 uppercase"
      title={name}
    >
      {initial}
    </div>
  )
}

export default function GroupFlightBoard({ flightEvents, members }: Props) {
  const [statusEvent, setStatusEvent] = useState<Event | null>(null)

  if (flightEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border bg-muted/30">
        <Plane className="h-10 w-10 text-muted-foreground/40 mb-4" />
        <p className="text-base font-semibold text-muted-foreground">No flights added yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1 text-center max-w-xs">
          Add a flight event in the Itinerary to see it here.
        </p>
      </div>
    )
  }

  // Group events by date
  const byDate = flightEvents.reduce<Record<string, Event[]>>((acc, ev) => {
    const key = ev.date
    if (!acc[key]) acc[key] = []
    acc[key].push(ev)
    return acc
  }, {})

  const sortedDates = Object.keys(byDate).sort()

  // Map userId → member for avatar lookups
  const memberMap = new Map(members.map(m => [m.user_id, m]))

  return (
    <>
      <div className="space-y-8">
        {sortedDates.map(date => (
          <div key={date}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {formatDate(date)}
            </h3>
            <div className="space-y-3">
              {byDate[date].map(event => {
                const fd = event.data as unknown as FlightData | undefined
                const member = memberMap.get(event.created_by)
                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3"
                  >
                    {/* Member avatar */}
                    {member ? (
                      <MemberAvatar member={member} />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-muted shrink-0" />
                    )}

                    {/* Flight number */}
                    <div className="w-24 shrink-0">
                      <p className="text-sm font-bold text-foreground">{fd?.flight_number ?? '—'}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{fd?.airline ?? event.title}</p>
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="text-center shrink-0">
                        <p className="text-sm font-semibold">{fd?.origin ?? '—'}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                          <PlaneTakeoff className="h-3 w-3" />
                          {formatTime(fd?.departure_time ?? null)}
                        </p>
                      </div>

                      <div className="flex-1 flex items-center gap-1 min-w-0 px-2">
                        <div className="h-px flex-1 bg-border" />
                        <Plane className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="h-px flex-1 bg-border" />
                      </div>

                      <div className="text-center shrink-0">
                        <p className="text-sm font-semibold">{fd?.destination ?? '—'}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                          <PlaneLanding className="h-3 w-3" />
                          {formatTime(fd?.arrival_time ?? null)}
                        </p>
                      </div>
                    </div>

                    {/* Confirmation */}
                    {event.confirmation_code && (
                      <div className="hidden sm:block shrink-0 text-right">
                        <p className="text-[11px] text-muted-foreground">Conf.</p>
                        <p className="text-xs font-mono font-semibold">{event.confirmation_code}</p>
                      </div>
                    )}

                    {/* Live status button */}
                    {fd?.flight_number && (
                      <button
                        onClick={() => setStatusEvent(event)}
                        className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        Status
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {statusEvent && (
        <FlightStatusModal
          event={statusEvent}
          open={!!statusEvent}
          onOpenChange={open => { if (!open) setStatusEvent(null) }}
        />
      )}
    </>
  )
}
