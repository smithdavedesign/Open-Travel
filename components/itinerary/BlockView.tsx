'use client'

import type { Event } from '@/types'
import { TYPE_CONFIG, fmt12h } from '@/components/events/EventCard'
import { Pencil, Trash2, type LucideProps } from 'lucide-react'

interface Props {
  timeline: Record<string, Event[]>
  onEdit: (event: Event) => void
  onDelete: (eventId: string) => void
}

function formatDayHeading(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

export default function BlockView({ timeline, onEdit, onDelete }: Props) {
  const dates = Object.keys(timeline).sort()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {dates.map((date, i) => {
        const events = timeline[date]
        return (
          <div
            key={date}
            className="bg-card rounded-xl border overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Gradient header */}
            <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-full h-12 w-12 flex items-center justify-center font-bold text-base shrink-0">
                  D{i + 1}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-lg leading-tight">Day {i + 1}</p>
                  <p className="text-sm text-primary-foreground/70 truncate">{formatDayHeading(date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs bg-white/20 text-white border border-white/30 rounded-full px-2.5 py-0.5">
                  {events.length} event{events.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Event list */}
            <div className="p-3 space-y-2">
              {events.map(event => {
                const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.custom
                return (
                  <div
                    key={event.id}
                    className="group flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className={`${cfg.color} rounded-md p-1.5 shrink-0 mt-0.5`}>
                      <cfg.icon className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug truncate">
                        {event.title}
                      </p>
                      {(event.start_time || event.location) && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {fmt12h(event.start_time)}
                          {event.location ? ` · ${event.location}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => onEdit(event)}
                        className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit event"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onDelete(event.id)}
                        className="p-1 rounded hover:bg-background text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete event"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
