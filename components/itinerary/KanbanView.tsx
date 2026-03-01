'use client'

import { useState } from 'react'
import type { Event } from '@/types'
import { TYPE_CONFIG, fmt12h } from '@/components/events/EventCard'
import { Pencil, Trash2, CheckCircle2, Radar } from 'lucide-react'
import FlightStatusModal from '@/components/flights/FlightStatusModal'

interface Props {
  timeline: Record<string, Event[]>
  onEdit: (event: Event) => void
  onDelete: (eventId: string) => void
}

function formatDayHeading(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function KanbanEventRow({
  event,
  onEdit,
  onDelete,
}: {
  event: Event
  onEdit: (event: Event) => void
  onDelete: (eventId: string) => void
}) {
  const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.custom
  const isFlight = event.type === 'flight'
  const [statusOpen, setStatusOpen] = useState(false)

  return (
    <>
      <div className="group flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted transition-colors">
        <div className={`${cfg.color} rounded p-1 shrink-0`}>
          <cfg.icon className="h-3 w-3 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate leading-snug">{event.title}</p>
          {(event.start_time || event.location) && (
            <p className="text-[11px] text-muted-foreground truncate leading-snug">
              {fmt12h(event.start_time)}
              {event.start_time && event.location ? ' · ' : ''}
              {event.location}
            </p>
          )}
        </div>
        {event.confirmation_code && (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 opacity-100 group-hover:opacity-0 transition-opacity" />
        )}
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {isFlight && (
            <button
              onClick={() => setStatusOpen(true)}
              className="p-1 rounded hover:bg-background text-blue-500 hover:text-blue-700 transition-colors"
              title="Check flight status"
            >
              <Radar className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={() => onEdit(event)}
            className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
            title="Edit"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="p-1 rounded hover:bg-background text-muted-foreground hover:text-destructive transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      {isFlight && (
        <FlightStatusModal event={event} open={statusOpen} onOpenChange={setStatusOpen} />
      )}
    </>
  )
}

export default function KanbanView({ timeline, onEdit, onDelete }: Props) {
  const dates = Object.keys(timeline).sort()

  return (
    <div className="overflow-x-auto pb-4 -mx-1 px-1">
      <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
        {dates.map((date, i) => {
          const events = timeline[date]
          const confirmed = events.filter(e => e.confirmation_code).length
          return (
            <div key={date} className="flex-shrink-0 w-64">
              <div className="bg-card rounded-xl border overflow-hidden">
                {/* Column header */}
                <div className="px-4 py-3 bg-muted/50 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center text-xs font-bold shrink-0">
                      D{i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-tight">Day {i + 1}</p>
                      <p className="text-[11px] text-muted-foreground leading-tight">{formatDayHeading(date)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5 border">
                      {events.length}
                    </span>
                    {confirmed > 0 && (
                      <span className="text-[10px] text-green-600 font-medium">{confirmed} confirmed</span>
                    )}
                  </div>
                </div>

                {/* Compact event rows */}
                <div className="p-2 space-y-0.5">
                  {events.map(event => (
                    <KanbanEventRow
                      key={event.id}
                      event={event}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                  {events.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No events</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
