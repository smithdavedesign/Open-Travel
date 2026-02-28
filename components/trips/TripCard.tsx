import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Trip } from '@/types'

const statusColor: Record<string, string> = {
  planning: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-slate-100 text-slate-600',
  archived: 'bg-slate-100 text-slate-400',
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return 'Dates TBD'
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start)
}

export default function TripCard({ trip }: { trip: Trip }) {
  return (
    <Link href={`/trips/${trip.id}`}>
      <div className="group rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h2 className="font-semibold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors">
            {trip.name}
          </h2>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize whitespace-nowrap ${statusColor[trip.status]}`}>
            {trip.status}
          </span>
        </div>

        {trip.destinations.length > 0 && (
          <p className="text-sm text-slate-500 mb-2">
            {trip.destinations.join(' → ')}
          </p>
        )}

        <p className="text-xs text-slate-400">
          {formatDateRange(trip.start_date, trip.end_date)}
        </p>
      </div>
    </Link>
  )
}
