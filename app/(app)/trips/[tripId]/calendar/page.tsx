'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { Event } from '@/types'
import type { WeatherByDate } from '@/lib/weather/openmeteo'
import WeatherBadge from '@/components/weather/WeatherBadge'

// ─── Constants ────────────────────────────────────────────────────────────

const HOUR_START  = 7   // 7 am
const HOUR_END    = 23  // 11 pm
const HOURS       = HOUR_END - HOUR_START
const PX_PER_HOUR = 64

const DAY_LABELS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const TYPE_COLOR: Record<string, string> = {
  flight:     'bg-blue-500',
  hotel:      'bg-purple-500',
  car_rental: 'bg-amber-500',
  activity:   'bg-green-500',
  excursion:  'bg-teal-500',
  restaurant: 'bg-orange-500',
  transfer:   'bg-slate-400',
  custom:     'bg-slate-500',
}

// ─── Date helpers ─────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function localDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00')
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function startOfWeek(d: Date): Date {
  const r = new Date(d)
  r.setDate(r.getDate() - r.getDay())
  return r
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

// ─── Time helpers ─────────────────────────────────────────────────────────

function parseTime(t: string): number { // minutes from midnight
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

function fmtHour(h: number): string {
  if (h === 0)  return '12 am'
  if (h < 12)   return `${h} am`
  if (h === 12) return '12 pm'
  return `${h - 12} pm`
}

function fmtTime(t: string): string {
  const total = parseTime(t)
  const h = Math.floor(total / 60)
  const m = total % 60
  const suffix = h >= 12 ? 'pm' : 'am'
  return `${h % 12 || 12}${m > 0 ? `:${String(m).padStart(2, '0')}` : ''}${suffix}`
}

// ─── Event positioning ────────────────────────────────────────────────────

interface PosEvent {
  event: Event
  top: number
  height: number
  left: string
  width: string
}

function positionDayEvents(events: Event[]): PosEvent[] {
  const timed = [...events]
    .filter(e => e.start_time)
    .sort((a, b) => parseTime(a.start_time!) - parseTime(b.start_time!))

  // Assign each event to the first column it doesn't overlap with
  const columns: Event[][] = []

  for (const ev of timed) {
    const start = parseTime(ev.start_time!)
    const end = ev.end_time ? parseTime(ev.end_time) : start + 60

    let placed = false
    for (const col of columns) {
      const last = col[col.length - 1]
      const lastEnd = last.end_time ? parseTime(last.end_time) : parseTime(last.start_time!) + 60
      if (lastEnd <= start) {
        col.push(ev)
        placed = true
        break
      }
    }
    if (!placed) columns.push([ev])
  }

  const totalCols = columns.length || 1
  const result: PosEvent[] = []

  columns.forEach((col, colIdx) => {
    col.forEach(ev => {
      const start = parseTime(ev.start_time!)
      const end = ev.end_time ? parseTime(ev.end_time) : start + 60
      const clampedStart = Math.max(start, HOUR_START * 60)
      const clampedEnd   = Math.min(end, HOUR_END * 60)
      const top    = (clampedStart - HOUR_START * 60) * PX_PER_HOUR / 60
      const height = Math.max((clampedEnd - clampedStart) * PX_PER_HOUR / 60, PX_PER_HOUR / 2)
      result.push({
        event: ev, top, height,
        left:  `${colIdx * (100 / totalCols)}%`,
        width: `${100 / totalCols}%`,
      })
    })
  })

  return result
}

// ─── EventPill — used in month view cells ─────────────────────────────────

function EventPill({ event }: { event: Event }) {
  const color = TYPE_COLOR[event.type] ?? 'bg-slate-500'
  return (
    <div className={`${color} text-white text-[10px] px-1.5 py-0.5 rounded truncate leading-tight`}>
      {event.start_time && (
        <span className="opacity-75 mr-1">{fmtTime(event.start_time)}</span>
      )}
      {event.title}
    </div>
  )
}

// ─── TimeBlock — used in week/day time grids ──────────────────────────────

function TimeBlock({ event, top, height, left, width }: PosEvent) {
  const color = TYPE_COLOR[event.type] ?? 'bg-slate-500'
  return (
    <div style={{ position: 'absolute', top, height: `${height}px`, left, width, padding: 2 }}>
      <div className={`${color} text-white rounded-md text-[11px] px-2 py-1 overflow-hidden h-full leading-tight`}>
        <p className="font-semibold truncate">{event.title}</p>
        {height > 30 && event.start_time && (
          <p className="opacity-80">
            {fmtTime(event.start_time)}
            {event.end_time ? `–${fmtTime(event.end_time)}` : ''}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Hour grid lines + labels (shared by week + day) ─────────────────────

const HOUR_SLOTS = Array.from({ length: HOURS }, (_, i) => HOUR_START + i)

function TimeGutter() {
  return (
    <div className="relative w-14 shrink-0" style={{ height: HOURS * PX_PER_HOUR }}>
      {HOUR_SLOTS.map(h => (
        <div
          key={h}
          style={{ position: 'absolute', top: (h - HOUR_START) * PX_PER_HOUR - 8 }}
          className="text-[10px] text-slate-400 text-right pr-2 w-full leading-none select-none"
        >
          {fmtHour(h)}
        </div>
      ))}
    </div>
  )
}

function HourLines() {
  return (
    <>
      {HOUR_SLOTS.map(h => (
        <div
          key={h}
          style={{ position: 'absolute', top: (h - HOUR_START) * PX_PER_HOUR, left: 0, right: 0 }}
          className="border-t border-slate-100 pointer-events-none"
        />
      ))}
    </>
  )
}

// ─── Month View ───────────────────────────────────────────────────────────

function MonthView({
  currentDate,
  events,
  weather = {},
  onDayClick,
}: {
  currentDate: Date
  events: Record<string, Event[]>
  weather?: WeatherByDate
  onDayClick: (d: Date) => void
}) {
  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDow = new Date(year, month, 1).getDay()
  const numDays  = daysInMonth(currentDate)
  const todayStr = toDateStr(new Date())

  const cells: Array<{ date: Date; thisMonth: boolean }> = []
  for (let i = 0; i < firstDow; i++) {
    cells.push({ date: addDays(new Date(year, month, 1), i - firstDow), thisMonth: false })
  }
  for (let d = 1; d <= numDays; d++) {
    cells.push({ date: new Date(year, month, d), thisMonth: true })
  }
  const tail = (7 - (cells.length % 7)) % 7
  for (let i = 1; i <= tail; i++) {
    cells.push({ date: new Date(year, month + 1, i), thisMonth: false })
  }

  return (
    <div>
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[11px] font-semibold text-slate-400 py-2 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map(({ date, thisMonth }, i) => {
          const ds = toDateStr(date)
          const dayEvents = events[ds] ?? []
          const isToday = ds === todayStr

          return (
            <div
              key={i}
              onClick={() => thisMonth && onDayClick(date)}
              className={`min-h-[100px] border-b border-r border-slate-100 p-1.5 transition-colors ${
                thisMonth ? 'cursor-pointer hover:bg-slate-50' : 'bg-slate-50/40'
              }`}
            >
              {/* Day number + weather */}
              <div className="flex items-center justify-between mb-1">
                <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday
                    ? 'bg-blue-600 text-white'
                    : thisMonth ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  {date.getDate()}
                </div>
                {thisMonth && weather[ds] && (
                  <WeatherBadge weather={weather[ds]} size="sm" />
                )}
              </div>

              {/* Event pills */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(ev => (
                  <EventPill key={ev.id} event={ev} />
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[10px] text-slate-400 pl-1">+{dayEvents.length - 3} more</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Week View ────────────────────────────────────────────────────────────

function WeekView({
  currentDate,
  events,
  weather = {},
}: {
  currentDate: Date
  events: Record<string, Event[]>
  weather?: WeatherByDate
}) {
  const weekStart = startOfWeek(currentDate)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const todayStr = toDateStr(new Date())

  const hasAllDay = days.some(d => (events[toDateStr(d)] ?? []).some(e => !e.start_time))

  return (
    <div className="overflow-y-auto max-h-[70vh]">
      {/* Sticky day-header row */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 grid" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
        <div /> {/* gutter spacer */}
        {days.map(d => {
          const ds = toDateStr(d)
          const isToday = ds === todayStr
          return (
            <div key={ds} className={`text-center py-2 border-l border-slate-100 ${isToday ? 'bg-blue-50' : ''}`}>
              <p className="text-[11px] font-medium text-slate-400 uppercase">{DAY_LABELS[d.getDay()]}</p>
              <p className={`text-sm font-bold mx-auto w-7 h-7 flex items-center justify-center rounded-full ${
                isToday ? 'bg-blue-600 text-white' : 'text-slate-800'
              }`}>
                {d.getDate()}
              </p>
              {weather[ds] && (
                <div className="flex justify-center mt-0.5">
                  <WeatherBadge weather={weather[ds]} size="sm" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* All-day row */}
      {hasAllDay && (
        <div className="grid border-b border-slate-100 bg-slate-50/60" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
          <div className="text-[10px] text-slate-400 text-right pr-2 pt-2 leading-none select-none">all day</div>
          {days.map(d => {
            const allDay = (events[toDateStr(d)] ?? []).filter(e => !e.start_time)
            return (
              <div key={toDateStr(d)} className="border-l border-slate-100 p-1 space-y-0.5 min-h-[28px]">
                {allDay.map(ev => <EventPill key={ev.id} event={ev} />)}
              </div>
            )
          })}
        </div>
      )}

      {/* Time grid */}
      <div className="grid" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
        <TimeGutter />

        {days.map(d => {
          const ds = toDateStr(d)
          const isToday = ds === todayStr
          const positioned = positionDayEvents((events[ds] ?? []).filter(e => e.start_time))

          return (
            <div
              key={ds}
              className={`border-l border-slate-100 relative ${isToday ? 'bg-blue-50/20' : ''}`}
              style={{ height: HOURS * PX_PER_HOUR }}
            >
              <HourLines />
              {positioned.map(p => <TimeBlock key={p.event.id} {...p} />)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Day View ─────────────────────────────────────────────────────────────

function DayView({
  currentDate,
  events,
  weather = {},
}: {
  currentDate: Date
  events: Record<string, Event[]>
  weather?: WeatherByDate
}) {
  const ds = toDateStr(currentDate)
  const dayEvents  = events[ds] ?? []
  const allDay     = dayEvents.filter(e => !e.start_time)
  const positioned = positionDayEvents(dayEvents.filter(e => e.start_time))
  const isToday    = ds === toDateStr(new Date())

  return (
    <div className="overflow-y-auto max-h-[70vh]">
      {/* Weather strip */}
      {weather[ds] && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 bg-slate-50/60">
          <WeatherBadge weather={weather[ds]} size="md" />
        </div>
      )}

      {/* All-day events */}
      {allDay.length > 0 && (
        <div className="border-b border-slate-100 bg-slate-50/60 p-2">
          <p className="text-[10px] text-slate-400 mb-1 uppercase font-medium tracking-wide">All day</p>
          <div className="space-y-0.5">
            {allDay.map(ev => <EventPill key={ev.id} event={ev} />)}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="flex">
        <TimeGutter />

        <div
          className={`flex-1 relative border-l border-slate-100 ${isToday ? 'bg-blue-50/20' : ''}`}
          style={{ height: HOURS * PX_PER_HOUR }}
        >
          <HourLines />

          {positioned.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-sm text-slate-300 select-none">No scheduled events</p>
            </div>
          ) : (
            positioned.map(p => <TimeBlock key={p.event.id} {...p} />)
          )}
        </div>
      </div>
    </div>
  )
}

// ─── CalendarPage ─────────────────────────────────────────────────────────

type CalView = 'month' | 'week' | 'day'

export default function CalendarPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const [events, setEvents]       = useState<Record<string, Event[]>>({})
  const [weather, setWeather]     = useState<WeatherByDate>({})
  const [loading, setLoading]     = useState(true)
  const [view, setView]           = useState<CalView>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    Promise.all([
      fetch(`/api/events?tripId=${tripId}`).then(r => r.json()),
      fetch(`/api/trips/${tripId}`).then(r => r.json()),
      fetch(`/api/trips/${tripId}/weather`).then(r => r.json()),
    ]).then(([eventsData, tripData, weatherData]) => {
      setEvents(eventsData)
      setWeather(weatherData.daily ?? {})
      // Initialize to trip start date, or first event date, or today
      const startDate = tripData.trip?.start_date
        ?? Object.keys(eventsData).sort()[0]
      if (startDate) setCurrentDate(localDate(startDate))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [tripId])

  function navigate(dir: 1 | -1) {
    setCurrentDate(prev => {
      if (view === 'month') return new Date(prev.getFullYear(), prev.getMonth() + dir, 1)
      if (view === 'week')  return addDays(prev, dir * 7)
      return addDays(prev, dir)
    })
  }

  function getTitle(): string {
    if (view === 'month') {
      return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    }
    if (view === 'week') {
      const ws = startOfWeek(currentDate)
      const we = addDays(ws, 6)
      const sameMonth = ws.getMonth() === we.getMonth()
      return sameMonth
        ? `${MONTH_NAMES[ws.getMonth()]} ${ws.getDate()} – ${we.getDate()}, ${ws.getFullYear()}`
        : `${MONTH_NAMES[ws.getMonth()]} ${ws.getDate()} – ${MONTH_NAMES[we.getMonth()]} ${we.getDate()}, ${we.getFullYear()}`
    }
    return currentDate.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    })
  }

  if (loading) {
    return <p className="text-sm text-slate-400 text-center py-20">Loading…</p>
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-slate-200">

        {/* View toggle */}
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm shrink-0">
          {(['month', 'week', 'day'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 capitalize transition-colors ${
                view === v ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Prev / title / next */}
        <div className="flex items-center gap-2 flex-1 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors text-lg leading-none"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-slate-900 text-center w-64 select-none">
            {getTitle()}
          </span>
          <button
            onClick={() => navigate(1)}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors text-lg leading-none"
          >
            ›
          </button>
        </div>

        {/* Today */}
        <button
          onClick={() => setCurrentDate(new Date())}
          className="text-sm px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
        >
          Today
        </button>
      </div>

      {/* Views */}
      {view === 'month' && (
        <MonthView
          currentDate={currentDate}
          events={events}
          weather={weather}
          onDayClick={d => { setCurrentDate(d); setView('day') }}
        />
      )}
      {view === 'week' && (
        <WeekView currentDate={currentDate} events={events} weather={weather} />
      )}
      {view === 'day' && (
        <DayView currentDate={currentDate} events={events} weather={weather} />
      )}
    </div>
  )
}
