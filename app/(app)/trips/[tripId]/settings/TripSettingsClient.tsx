'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, MapPin, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import EditTripModal from '@/components/trips/EditTripModal'
import type { Trip, MemberRole } from '@/types'

interface Props {
  trip: Trip
  role: MemberRole
}

function formatDate(d: string | null): string {
  if (!d) return 'Not set'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function TripSettingsClient({ trip: initialTrip, role }: Props) {
  const router = useRouter()
  const [trip, setTrip] = useState(initialTrip)
  const [editOpen, setEditOpen] = useState(false)
  const canEdit = role === 'owner' || role === 'editor'

  const handleSaved = (updated: Trip) => {
    setTrip(updated)
    router.refresh()
  }

  return (
    <>
      <div className="bg-card rounded-xl border p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">{trip.name}</h2>
            {trip.description && (
              <p className="text-sm text-muted-foreground mt-1">{trip.description}</p>
            )}
          </div>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Destinations</p>
              <p className="text-sm text-foreground mt-0.5">
                {trip.destinations.length > 0 ? trip.destinations.join(', ') : 'No destinations set'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Dates</p>
              <p className="text-sm text-foreground mt-0.5">
                {trip.start_date || trip.end_date
                  ? `${formatDate(trip.start_date)} – ${formatDate(trip.end_date)}`
                  : 'No dates set'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {canEdit && (
        <EditTripModal
          trip={trip}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
