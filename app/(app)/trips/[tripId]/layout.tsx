import { createClient } from '@/lib/supabase/server'
import * as TripController from '@/controllers/trip.controller'
import TripNav from '@/components/trips/TripNav'
import TripRealtimeSync from '@/components/realtime/TripRealtimeSync'
import { notFound } from 'next/navigation'

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return ''
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start)
}

const statusColor: Record<string, string> = {
  planning:  'bg-blue-100 text-blue-700',
  active:    'bg-green-100 text-green-700',
  completed: 'bg-slate-100 text-slate-600',
  archived:  'bg-slate-100 text-slate-400',
}

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { trip, members } = await TripController.getTripWithMembers(tripId)
  if (!trip) return notFound()

  const dateRange = formatDateRange(trip.start_date, trip.end_date)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Trip header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 pt-6 pb-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <a href="/trips" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
                  My Trips
                </a>
                <span className="text-slate-300">/</span>
                <span className="text-sm text-slate-600 font-medium">{trip.name}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">{trip.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                {trip.destinations.length > 0 && (
                  <span className="text-sm text-slate-500">{trip.destinations.join(' → ')}</span>
                )}
                {dateRange && (
                  <span className="text-sm text-slate-400">{dateRange}</span>
                )}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColor[trip.status]}`}>
                  {trip.status}
                </span>
              </div>
            </div>

            {/* Member avatars */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex -space-x-2">
                {members.slice(0, 5).map(m => (
                  <div
                    key={m.id}
                    title={m.profiles?.full_name ?? m.profiles?.email ?? 'Member'}
                    className="h-8 w-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-semibold text-blue-700 uppercase"
                  >
                    {(m.profiles?.full_name?.[0] ?? m.profiles?.email?.[0] ?? '?')}
                  </div>
                ))}
                {members.length > 5 && (
                  <div className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-semibold text-slate-600">
                    +{members.length - 5}
                  </div>
                )}
              </div>
            </div>
          </div>

          <TripNav tripId={tripId} />
        </div>
      </div>

      {/* Real-time sync — triggers router.refresh() on any trip data change */}
      <TripRealtimeSync tripId={tripId} />

      {/* Page content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </div>
    </div>
  )
}
