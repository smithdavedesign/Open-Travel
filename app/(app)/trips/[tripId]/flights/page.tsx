import { createClient } from '@/lib/supabase/server'
import * as TripController from '@/controllers/trip.controller'
import * as EventModel from '@/models/event.model'
import GroupFlightBoard from '@/components/flights/GroupFlightBoard'
import { Plane } from 'lucide-react'

export default async function FlightsPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ members }, flightEvents] = await Promise.all([
    TripController.getTripWithMembers(tripId),
    EventModel.getEventsByTypeAndTrip(tripId, 'flight'),
  ])

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <Plane className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Group Flights</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          All flights for this trip — check live status for any flight
        </p>
      </div>

      <GroupFlightBoard flightEvents={flightEvents} members={members} />
    </div>
  )
}
