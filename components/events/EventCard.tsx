import type { Event } from '@/types'

const TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  flight:     { icon: '✈️', color: 'bg-blue-50 border-blue-100',    label: 'Flight' },
  hotel:      { icon: '🏨', color: 'bg-purple-50 border-purple-100', label: 'Hotel' },
  car_rental: { icon: '🚗', color: 'bg-yellow-50 border-yellow-100', label: 'Car Rental' },
  activity:   { icon: '🎯', color: 'bg-green-50 border-green-100',   label: 'Activity' },
  excursion:  { icon: '🗺️', color: 'bg-teal-50 border-teal-100',    label: 'Excursion' },
  restaurant: { icon: '🍽️', color: 'bg-orange-50 border-orange-100', label: 'Restaurant' },
  transfer:   { icon: '🚌', color: 'bg-slate-50 border-slate-200',   label: 'Transfer' },
  custom:     { icon: '📌', color: 'bg-slate-50 border-slate-200',   label: 'Custom' },
}

function fmt12h(time: string | null): string | null {
  if (!time) return null
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function EventCard({ event }: { event: Event }) {
  const config = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.custom

  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${config.color}`}>
      <span className="text-xl mt-0.5 select-none">{config.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-slate-900 text-sm leading-snug">{event.title}</p>
          {event.cost != null && (
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
              {event.currency} {event.cost.toFixed(2)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
          {(event.start_time || event.end_time) && (
            <span className="text-xs text-slate-500">
              {fmt12h(event.start_time)}{event.end_time ? ` – ${fmt12h(event.end_time)}` : ''}
            </span>
          )}
          {event.location && (
            <span className="text-xs text-slate-500 truncate">{event.location}</span>
          )}
          {event.confirmation_code && (
            <span className="text-xs text-slate-400">#{event.confirmation_code}</span>
          )}
        </div>

        {event.notes && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{event.notes}</p>
        )}
      </div>
    </div>
  )
}
