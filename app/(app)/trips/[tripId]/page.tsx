import { createClient } from '@/lib/supabase/server'
import * as EventController from '@/controllers/event.controller'
import EventCard from '@/components/events/EventCard'
import AddEventModal from '@/components/events/AddEventModal'
import ActivityFeed from '@/components/activity/ActivityFeed'

function formatDayHeading(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export default async function TripTimelinePage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const timeline = await EventController.getTripTimeline(tripId)
  const sortedDates = Object.keys(timeline).sort()

  return (
    <div className="flex gap-6 items-start">
      {/* Timeline — main column */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-slate-900">Itinerary</h2>
          <AddEventModal tripId={tripId} />
        </div>

        {sortedDates.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 bg-white">
            <p className="text-3xl mb-3">🗓️</p>
            <p className="text-base font-medium text-slate-700">No events yet</p>
            <p className="text-sm text-slate-400 mt-1 mb-5">
              Add events manually or upload a booking confirmation
            </p>
            <AddEventModal tripId={tripId} />
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map(date => (
              <div key={date}>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  {formatDayHeading(date)}
                </h3>
                <div className="space-y-2">
                  {timeline[date].map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity feed — right sidebar */}
      <div className="w-72 shrink-0 hidden lg:block">
        <ActivityFeed tripId={tripId} />
      </div>
    </div>
  )
}
