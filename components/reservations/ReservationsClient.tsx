'use client'

import { useState } from 'react'
import { Plane, Hotel, Car, Calendar, Hash, ExternalLink } from 'lucide-react'
import FlightStatusModal from '@/components/flights/FlightStatusModal'
import type { Event, FlightData, HotelData, CarRentalData } from '@/types'

interface Props {
  flights: Event[]
  hotels: Event[]
  carRentals: Event[]
}

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return date
  }
}

function SectionHeader({ icon: Icon, label, count }: { icon: React.ElementType; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="text-lg font-semibold text-foreground">{label}</h3>
      <span className="text-sm text-muted-foreground">({count})</span>
    </div>
  )
}

function EmptySection({ label }: { label: string }) {
  return (
    <p className="text-sm text-muted-foreground py-6 text-center rounded-xl border border-dashed border-border bg-muted/20">
      No {label} reservations added yet
    </p>
  )
}

function FlightCard({ event, onStatus }: { event: Event; onStatus: (ev: Event) => void }) {
  const fd = event.data as unknown as FlightData | undefined
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-sm">{fd?.airline ?? event.title}</p>
          <p className="text-2xl font-bold text-foreground mt-0.5">{fd?.flight_number ?? '—'}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] text-muted-foreground">Date</p>
          <p className="text-sm font-medium">{formatDate(event.date)}</p>
        </div>
      </div>

      {fd && (
        <div className="flex items-center gap-3 text-sm">
          <div className="text-center">
            <p className="text-lg font-bold">{fd.origin}</p>
          </div>
          <div className="flex-1 flex items-center gap-1">
            <div className="h-px flex-1 bg-border" />
            <Plane className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{fd.destination}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1 border-t border-border/60">
        {event.confirmation_code && (
          <span className="flex items-center gap-1">
            <Hash className="h-3 w-3" />
            {event.confirmation_code}
          </span>
        )}
        {fd?.seat && <span>Seat {fd.seat}</span>}
        {fd?.class && <span className="capitalize">{fd.class}</span>}
        {fd?.terminal && <span>Terminal {fd.terminal}</span>}
        {fd?.gate && <span>Gate {fd.gate}</span>}
      </div>

      {fd?.flight_number && (
        <button
          onClick={() => onStatus(event)}
          className="w-full text-xs font-medium py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
        >
          Check Live Status
        </button>
      )}
    </div>
  )
}

function HotelCard({ event }: { event: Event }) {
  const hd = event.data as unknown as HotelData | undefined
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-sm">{hd?.property_name ?? event.title}</p>
          {hd?.address && <p className="text-xs text-muted-foreground mt-0.5">{hd.address}</p>}
        </div>
        {event.confirmation_code && (
          <div className="text-right shrink-0">
            <p className="text-[11px] text-muted-foreground">Conf.</p>
            <p className="text-xs font-mono font-semibold">{event.confirmation_code}</p>
          </div>
        )}
      </div>

      <div className="flex gap-4 text-sm pt-1 border-t border-border/60">
        <div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Check-in
          </p>
          <p className="font-medium">{hd?.check_in ? formatDate(hd.check_in) : formatDate(event.date)}</p>
        </div>
        {hd?.check_out && (
          <div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Check-out
            </p>
            <p className="font-medium">{formatDate(hd.check_out)}</p>
          </div>
        )}
        {hd?.room_type && (
          <div>
            <p className="text-[11px] text-muted-foreground">Room</p>
            <p className="font-medium">{hd.room_type}</p>
          </div>
        )}
      </div>

      {event.notes && (
        <p className="text-xs text-muted-foreground">{event.notes}</p>
      )}
    </div>
  )
}

function CarRentalCard({ event }: { event: Event }) {
  const cd = event.data as unknown as CarRentalData | undefined
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-sm">{cd?.provider ?? event.title}</p>
          {cd?.vehicle_class && <p className="text-xs text-muted-foreground mt-0.5">{cd.vehicle_class}</p>}
        </div>
        {event.confirmation_code && (
          <div className="text-right shrink-0">
            <p className="text-[11px] text-muted-foreground">Conf.</p>
            <p className="text-xs font-mono font-semibold">{event.confirmation_code}</p>
          </div>
        )}
      </div>

      <div className="flex gap-4 text-sm pt-1 border-t border-border/60">
        {cd?.pickup_location && (
          <div>
            <p className="text-[11px] text-muted-foreground">Pick-up</p>
            <p className="font-medium">{cd.pickup_location}</p>
          </div>
        )}
        {cd?.dropoff_location && (
          <div>
            <p className="text-[11px] text-muted-foreground">Drop-off</p>
            <p className="font-medium">{cd.dropoff_location}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ReservationsClient({ flights, hotels, carRentals }: Props) {
  const [statusEvent, setStatusEvent] = useState<Event | null>(null)
  const hasAny = flights.length > 0 || hotels.length > 0 || carRentals.length > 0

  if (!hasAny) {
    return (
      <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border bg-muted/30">
        <ExternalLink className="h-10 w-10 text-muted-foreground/40 mb-4" />
        <p className="text-base font-semibold text-muted-foreground">No reservations yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1 text-center max-w-xs">
          Add flight, hotel, or car rental events in the Itinerary to see them here.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-10">
        {/* Flights */}
        <section>
          <SectionHeader icon={Plane} label="Flights" count={flights.length} />
          {flights.length === 0 ? (
            <EmptySection label="flight" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {flights.map(ev => (
                <FlightCard key={ev.id} event={ev} onStatus={setStatusEvent} />
              ))}
            </div>
          )}
        </section>

        {/* Hotels */}
        <section>
          <SectionHeader icon={Hotel} label="Hotels & Accommodations" count={hotels.length} />
          {hotels.length === 0 ? (
            <EmptySection label="hotel" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hotels.map(ev => (
                <HotelCard key={ev.id} event={ev} />
              ))}
            </div>
          )}
        </section>

        {/* Car Rentals */}
        <section>
          <SectionHeader icon={Car} label="Car Rentals" count={carRentals.length} />
          {carRentals.length === 0 ? (
            <EmptySection label="car rental" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {carRentals.map(ev => (
                <CarRentalCard key={ev.id} event={ev} />
              ))}
            </div>
          )}
        </section>
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
