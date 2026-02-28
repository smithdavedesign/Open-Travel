import { notFound } from 'next/navigation'
import * as TripController from '@/controllers/trip.controller'
import * as EventController from '@/controllers/event.controller'

const TYPE_ICONS: Record<string, string> = {
  flight: '✈️', hotel: '🏨', car_rental: '🚗', activity: '🎯',
  excursion: '🗺️', restaurant: '🍽️', transfer: '🚌', custom: '📌',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return 'Dates TBD'
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start)
}

export default async function SharedTripPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const trip = await TripController.getTripByShareToken(token)
  if (!trip) return notFound()

  const { members } = await TripController.getTripWithMembers(trip.id)
  const timeline = await EventController.getTripTimeline(trip.id)
  const sortedDates = Object.keys(timeline).sort()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Trip header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-xl font-bold text-slate-900">{trip.name}</h1>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 capitalize shrink-0">
            {trip.status}
          </span>
        </div>
        {trip.destinations.length > 0 && (
          <p className="text-sm text-slate-500 mb-1">{trip.destinations.join(' → ')}</p>
        )}
        <p className="text-sm text-slate-400">{formatDateRange(trip.start_date, trip.end_date)}</p>
        {trip.description && (
          <p className="text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100">{trip.description}</p>
        )}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
          <div className="flex -space-x-2">
            {members.slice(0, 5).map(m => (
              <div
                key={m.id}
                title={m.profiles?.full_name ?? m.profiles?.email ?? 'Member'}
                className="h-7 w-7 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-semibold text-blue-700 uppercase"
              >
                {m.profiles?.full_name?.[0] ?? m.profiles?.email?.[0] ?? '?'}
              </div>
            ))}
          </div>
          <span className="text-xs text-slate-400">
            {members.length} traveller{members.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Itinerary</h2>
        {sortedDates.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-12">No events added yet.</p>
        ) : (
          <div className="space-y-6">
            {sortedDates.map(date => (
              <div key={date}>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  {formatDate(date)}
                </h3>
                <div className="space-y-2">
                  {timeline[date].map(event => (
                    <div key={event.id} className="bg-white rounded-xl border border-slate-100 p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-lg shrink-0">{TYPE_ICONS[event.type] ?? '📌'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm">{event.title}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                            {event.start_time && (
                              <span className="text-xs text-slate-400">{event.start_time}</span>
                            )}
                            {event.location && (
                              <span className="text-xs text-slate-400">{event.location}</span>
                            )}
                            {event.confirmation_code && (
                              <span className="text-xs text-slate-400">Ref: {event.confirmation_code}</span>
                            )}
                          </div>
                          {event.notes && (
                            <p className="text-xs text-slate-400 mt-1">{event.notes}</p>
                          )}
                        </div>
                        {event.cost && (
                          <span className="text-sm font-medium text-slate-700 shrink-0">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: event.currency,
                              maximumFractionDigits: 0,
                            }).format(event.cost)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-center text-slate-300 pb-4">
        Shared via Open Travel · Read-only view
      </p>
    </div>
  )
}
