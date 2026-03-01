import { createClient } from '@/lib/supabase/server'
import * as EventController from '@/controllers/event.controller'
import * as TripModel from '@/models/trip.model'
import { fetchTripWeather } from '@/lib/weather/openmeteo'
import ItineraryClient from '@/components/itinerary/ItineraryClient'

export default async function ItineraryPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [timeline, trip] = await Promise.all([
    EventController.getTripTimeline(tripId),
    TripModel.getTripById(tripId),
  ])

  const weather = await fetchTripWeather(
    trip?.destinations ?? [],
    trip?.start_date ?? null,
    trip?.end_date ?? null
  )

  return (
    <ItineraryClient
      tripId={tripId}
      initialTimeline={timeline}
      weather={weather?.daily ?? {}}
    />
  )
}
