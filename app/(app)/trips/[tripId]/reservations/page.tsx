import { createClient } from '@/lib/supabase/server'
import * as EventModel from '@/models/event.model'
import ReservationsClient from '@/components/reservations/ReservationsClient'
import { BookMarked } from 'lucide-react'

export default async function ReservationsPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const events = await EventModel.getReservationEvents(tripId)

  const flights    = events.filter(e => e.type === 'flight')
  const hotels     = events.filter(e => e.type === 'hotel')
  const carRentals = events.filter(e => e.type === 'car_rental')

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <BookMarked className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Reservations</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          All flights, hotels, and car rentals for this trip
        </p>
      </div>

      <ReservationsClient
        flights={flights}
        hotels={hotels}
        carRentals={carRentals}
      />
    </div>
  )
}
