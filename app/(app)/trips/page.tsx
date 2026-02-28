import { createClient } from '@/lib/supabase/server'
import * as TripController from '@/controllers/trip.controller'
import TripCard from '@/components/trips/TripCard'
import CreateTripModal from '@/components/trips/CreateTripModal'

export default async function TripsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const trips = user ? await TripController.getUserTrips(user.id) : []

  const active = trips.filter(t => t.status === 'active' || t.status === 'planning')
  const past = trips.filter(t => t.status === 'completed' || t.status === 'archived')

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Trips</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {trips.length === 0 ? 'No trips yet' : `${trips.length} trip${trips.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <CreateTripModal />
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-24 rounded-2xl border border-dashed border-slate-200">
          <p className="text-4xl mb-3">✈️</p>
          <p className="text-base font-medium text-slate-700">No trips yet</p>
          <p className="text-sm text-slate-400 mt-1 mb-5">Create your first trip to get started</p>
          <CreateTripModal />
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Upcoming & Planning</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {active.map(trip => <TripCard key={trip.id} trip={trip} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Past Trips</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {past.map(trip => <TripCard key={trip.id} trip={trip} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
