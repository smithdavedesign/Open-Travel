'use client'

import { Pencil, Trash2, Plane, Hotel, Car, UtensilsCrossed, MapPin, Ticket, Calendar, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Event } from '@/types'

export const TYPE_CONFIG: Record<string, {
  icon: React.ElementType
  color: string   // solid bg for the icon circle
  bg: string      // card background
  label: string
}> = {
  flight:     { icon: Plane,           color: 'bg-blue-500',   bg: 'bg-card',   label: 'Flight' },
  hotel:      { icon: Hotel,           color: 'bg-purple-500', bg: 'bg-card',   label: 'Hotel' },
  car_rental: { icon: Car,             color: 'bg-green-500',  bg: 'bg-card',   label: 'Car Rental' },
  activity:   { icon: Ticket,          color: 'bg-pink-500',   bg: 'bg-card',   label: 'Activity' },
  excursion:  { icon: MapPin,          color: 'bg-teal-500',   bg: 'bg-card',   label: 'Excursion' },
  restaurant: { icon: UtensilsCrossed, color: 'bg-orange-500', bg: 'bg-card',   label: 'Restaurant' },
  transfer:   { icon: Car,             color: 'bg-gray-500',   bg: 'bg-card',   label: 'Transfer' },
  custom:     { icon: Calendar,        color: 'bg-indigo-500', bg: 'bg-card',   label: 'Custom' },
}

export function fmt12h(time: string | null): string | null {
  if (!time) return null
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

interface Props {
  event: Event
  onEdit?: (event: Event) => void
  onDelete?: (eventId: string) => void
}

export default function EventCard({ event, onEdit, onDelete }: Props) {
  const config = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.custom
  const Icon = config.icon

  return (
    <div className="rounded-xl border bg-card hover:shadow-md transition-shadow group">
      <div className="p-4 flex gap-4">
        {/* Colored icon circle — matches Figma exactly */}
        <div className={`${config.color} rounded-lg p-3 h-12 w-12 flex items-center justify-center shrink-0`}>
          <Icon className="h-6 w-6 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-sm leading-snug">{event.title}</h4>
            <Badge variant={event.confirmation_code ? 'default' : 'secondary'} className="text-xs shrink-0">
              {event.confirmation_code ? 'Confirmed' : 'Pending'}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm text-muted-foreground mb-1">
            {(event.start_time || event.end_time) && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{fmt12h(event.start_time)}{event.end_time ? ` – ${fmt12h(event.end_time)}` : ''}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            {event.cost != null && (
              <span className="font-medium text-foreground">
                {event.currency} {event.cost.toFixed(2)}
              </span>
            )}
          </div>

          {event.notes && (
            <p className="text-sm text-muted-foreground line-clamp-2">{event.notes}</p>
          )}
        </div>

        {/* Edit / Delete — hover reveal */}
        {(onEdit || onDelete) && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {onEdit && (
              <button
                onClick={() => onEdit(event)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Edit event"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(event.id)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                title="Delete event"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
