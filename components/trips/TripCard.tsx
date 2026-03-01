import Link from 'next/link'
import { MapPin, Calendar, ArrowRight, Plane } from 'lucide-react'
import type { Trip } from '@/types'

const statusConfig: Record<string, { label: string; className: string }> = {
  planning:  { label: 'Planning',  className: 'bg-amber-100 text-amber-700' },
  active:    { label: 'Active',    className: 'bg-green-100 text-green-700' },
  completed: { label: 'Completed', className: 'bg-slate-100 text-slate-600' },
  archived:  { label: 'Archived',  className: 'bg-slate-100 text-slate-400' },
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return 'Dates TBD'
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start)
}

export default function TripCard({ trip }: { trip: Trip }) {
  const status = statusConfig[trip.status] ?? statusConfig.planning

  return (
    <Link href={`/trips/${trip.id}`}>
      <div className="group bg-card rounded-2xl border overflow-hidden hover:shadow-lg transition-all cursor-pointer">
        {/* Cover image or gradient placeholder */}
        {trip.cover_photo_url ? (
          <div className="h-44 overflow-hidden relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={trip.cover_photo_url}
              alt={trip.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <span className={`absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${status.className}`}>
              {status.label}
            </span>
          </div>
        ) : (
          <div className="h-44 bg-gradient-to-br from-primary/5 to-primary/15 flex items-center justify-center relative">
            <Plane className="h-14 w-14 text-primary/25 group-hover:scale-110 transition-transform duration-300" />
            <span className={`absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${status.className}`}>
              {status.label}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          <h2 className="font-semibold text-foreground text-base leading-snug mb-3 group-hover:text-primary transition-colors">
            {trip.name}
          </h2>

          {trip.destinations.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{trip.destinations.join(' → ')}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDateRange(trip.start_date, trip.end_date)}</span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            {trip.budget != null ? (
              <span className="text-sm font-semibold text-primary">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: trip.budget_currency ?? 'USD',
                  maximumFractionDigits: 0,
                }).format(trip.budget)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">No budget set</span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors font-medium">
              View Details
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
