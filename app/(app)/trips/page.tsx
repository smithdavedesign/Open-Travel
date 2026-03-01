import { createClient } from '@/lib/supabase/server'
import * as TripController from '@/controllers/trip.controller'
import TripCard from '@/components/trips/TripCard'
import CreateTripModal from '@/components/trips/CreateTripModal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plane, Map, Activity, CheckCircle } from 'lucide-react'

export default async function TripsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const trips = user ? await TripController.getUserTrips(user.id) : []

  const today = new Date().toISOString().split('T')[0]

  const active   = trips.filter(t => t.status === 'active')
  const upcoming = trips.filter(t =>
    t.status === 'planning' || (t.status !== 'active' && t.status !== 'completed' && t.status !== 'archived' && t.start_date && t.start_date > today)
  )
  const past     = trips.filter(t => t.status === 'completed' || t.status === 'archived')

  const totalBudget = trips
    .filter(t => t.budget != null)
    .reduce((sum, t) => sum + (t.budget ?? 0), 0)

  const stats = [
    { label: 'Total Trips',  value: trips.length,  icon: Map,          color: 'text-primary',      bg: 'bg-primary/10' },
    { label: 'Active',       value: active.length,  icon: Activity,     color: 'text-green-600',   bg: 'bg-green-50' },
    { label: 'Planning',     value: upcoming.length, icon: Plane,       color: 'text-amber-600',   bg: 'bg-amber-50' },
    { label: 'Past',         value: past.length,    icon: CheckCircle,  color: 'text-muted-foreground', bg: 'bg-muted' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Trips</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your travel plans and collaborate with your group
          </p>
        </div>
        <CreateTripModal />
      </div>

      {/* Stats row */}
      {trips.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-card rounded-xl border p-4 flex items-center gap-3">
              <div className={`${bg} rounded-lg p-2.5 shrink-0`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {trips.length === 0 ? (
        <div className="text-center py-24 rounded-2xl border border-dashed">
          <Plane className="h-12 w-12 text-primary/30 mx-auto mb-3" />
          <p className="text-base font-medium text-foreground">No trips yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Create your first trip to get started</p>
          <CreateTripModal />
        </div>
      ) : (
        <Tabs defaultValue={active.length > 0 ? 'active' : upcoming.length > 0 ? 'upcoming' : 'past'}>
          <TabsList className="mb-6">
            <TabsTrigger value="active">
              Active ({active.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Planning ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({past.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {active.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No active trips right now.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {active.map(trip => <TripCard key={trip.id} trip={trip} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No trips being planned.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcoming.map(trip => <TripCard key={trip.id} trip={trip} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {past.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No past trips yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {past.map(trip => <TripCard key={trip.id} trip={trip} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
