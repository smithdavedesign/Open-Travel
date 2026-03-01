'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { List, Columns3, LayoutGrid, Calendar } from 'lucide-react'
import type { Event } from '@/types'
import type { WeatherByDate } from '@/lib/weather/openmeteo'
import EventCard from '@/components/events/EventCard'
import AddEventModal from '@/components/events/AddEventModal'
import ExportPDFButton from '@/components/trips/ExportPDFButton'
import ActivityFeed from '@/components/activity/ActivityFeed'
import WeatherBadge from '@/components/weather/WeatherBadge'
import KanbanView from './KanbanView'
import BlockView from './BlockView'
import CalendarView from '@/components/calendar/CalendarView'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type View = 'list' | 'kanban' | 'block' | 'calendar'

interface Props {
  tripId: string
  initialTimeline: Record<string, Event[]>
  weather: WeatherByDate
}

const VIEWS: { id: View; icon: React.ElementType; label: string }[] = [
  { id: 'list',     icon: List,       label: 'List' },
  { id: 'kanban',   icon: Columns3,   label: 'Kanban' },
  { id: 'block',    icon: LayoutGrid, label: 'Block' },
  { id: 'calendar', icon: Calendar,   label: 'Calendar' },
]

function formatDayHeading(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function getDayNumber(dateStr: string, sortedDates: string[]): number {
  return sortedDates.indexOf(dateStr) + 1
}

export default function ItineraryClient({ tripId, initialTimeline, weather }: Props) {
  const router = useRouter()
  const [view, setView]               = useState<View>('list')
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [editOpen, setEditOpen]       = useState(false)
  const [deletedIds, setDeletedIds]   = useState<Set<string>>(new Set())

  const timeline = useMemo(() => {
    if (deletedIds.size === 0) return initialTimeline
    const result: Record<string, Event[]> = {}
    for (const [date, events] of Object.entries(initialTimeline)) {
      const filtered = events.filter(e => !deletedIds.has(e.id))
      if (filtered.length > 0) result[date] = filtered
    }
    return result
  }, [initialTimeline, deletedIds])

  const sortedDates = useMemo(() => Object.keys(timeline).sort(), [timeline])
  // For day numbering we use all dates including any that are now empty
  const allSortedDates = useMemo(() => Object.keys(initialTimeline).sort(), [initialTimeline])

  const handleEdit = useCallback((event: Event) => {
    setEditingEvent(event)
    setEditOpen(true)
  }, [])

  const handleDelete = useCallback(async (eventId: string) => {
    setDeletedIds(prev => new Set(prev).add(eventId))
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      router.refresh()
    } catch {
      setDeletedIds(prev => {
        const s = new Set(prev)
        s.delete(eventId)
        return s
      })
    }
  }, [router])

  const isEmpty = sortedDates.length === 0 && view !== 'calendar'

  return (
    <div className="flex gap-6 items-start">
      {/* Main column */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-slate-900">Itinerary</h2>
          <div className="flex items-center gap-3">
            {/* View toggle — Figma ToggleGroup style */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground hidden sm:inline">View:</span>
              <ToggleGroup
                type="single"
                value={view}
                onValueChange={v => v && setView(v as View)}
                className="border rounded-lg p-0.5 bg-white"
              >
                {VIEWS.map(({ id, icon: Icon, label }) => (
                  <ToggleGroupItem key={id} value={id} className="gap-1.5 px-3 h-8 text-sm">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <ExportPDFButton tripId={tripId} />
            <AddEventModal tripId={tripId} />
          </div>
        </div>

        {/* Empty state */}
        {isEmpty ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 bg-white">
            <p className="text-3xl mb-3">🗓️</p>
            <p className="text-base font-medium text-slate-700">No events yet</p>
            <p className="text-sm text-slate-400 mt-1 mb-5">
              Add events manually or upload a booking confirmation
            </p>
            <AddEventModal tripId={tripId} />
          </div>
        ) : (
          <>
            {view === 'list' && (
              <div className="space-y-8">
                {sortedDates.map(date => {
                  const dayNum = getDayNumber(date, allSortedDates)
                  return (
                    <div key={date} className="relative">
                      {/* Day header */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-primary text-primary-foreground rounded-full h-10 w-10 flex items-center justify-center font-bold text-sm shrink-0">
                          D{dayNum}
                        </div>
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-bold text-sm">Day {dayNum}</h3>
                            <p className="text-xs text-muted-foreground">{formatDayHeading(date)}</p>
                          </div>
                          {weather[date] && (
                            <WeatherBadge weather={weather[date]} size="md" />
                          )}
                        </div>
                        <div className="flex-1 h-px bg-border ml-2" />
                      </div>

                      {/* Events with timeline line */}
                      <div className="ml-14 space-y-3 relative">
                        <div className="absolute left-[-30px] top-0 bottom-0 w-px bg-border" />
                        {timeline[date].map(event => (
                          <div key={event.id} className="relative">
                            <div className="absolute left-[-34px] top-5 h-2 w-2 rounded-full bg-primary" />
                            <EventCard
                              event={event}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {view === 'kanban' && (
              <KanbanView
                timeline={timeline}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}

            {view === 'block' && (
              <BlockView
                timeline={timeline}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}

            {view === 'calendar' && <CalendarView />}
          </>
        )}
      </div>

      {/* Activity feed — only shown in list view */}
      {view === 'list' && (
        <div className="w-72 shrink-0 hidden lg:block">
          <ActivityFeed tripId={tripId} />
        </div>
      )}

      {/* Edit modal — controlled */}
      {editingEvent && (
        <AddEventModal
          tripId={tripId}
          event={editingEvent}
          open={editOpen}
          onOpenChange={o => {
            setEditOpen(o)
            if (!o) {
              setEditingEvent(null)
              router.refresh()
            }
          }}
        />
      )}
    </div>
  )
}
