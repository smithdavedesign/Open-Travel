import { createClient } from '@/lib/supabase/server'
import * as TripController from '@/controllers/trip.controller'
import TripSidebar from '@/components/trips/TripSidebar'
import TripRealtimeSync from '@/components/realtime/TripRealtimeSync'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Bell } from 'lucide-react'

const statusColor: Record<string, string> = {
  planning:  'bg-blue-100 text-blue-700',
  active:    'bg-green-100 text-green-700',
  completed: 'bg-slate-100 text-slate-600',
  archived:  'bg-slate-100 text-slate-400',
}

function fmtDate(d: string, year = false) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', ...(year ? { year: 'numeric' } : {}),
  })
}

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { trip, members } = await TripController.getTripWithMembers(tripId)
  if (!trip) return notFound()

  const userName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? ''
  const userInitial = (userName[0] ?? '?').toUpperCase()

  const dateRange = trip.start_date
    ? trip.end_date
      ? `${fmtDate(trip.start_date)} – ${fmtDate(trip.end_date, true)}`
      : fmtDate(trip.start_date, true)
    : ''

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <TripSidebar
        tripId={tripId}
        tripName={trip.name}
        userInitial={userInitial}
        userName={userName}
      />

      {/* Main content column */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-card border-b px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {trip.destinations.length > 0 && (
              <span className="text-sm text-foreground font-medium truncate">
                {trip.destinations.join(' → ')}
              </span>
            )}
            {dateRange && (
              <span className="text-sm text-muted-foreground shrink-0">{dateRange}</span>
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${statusColor[trip.status]}`}>
              {trip.status}
            </span>
          </div>

          {/* Right side: bell + member avatars */}
          <div className="flex items-center gap-3 shrink-0">
          {/* Notification bell */}
          <Link
            href={`/trips/${tripId}/collaboration`}
            className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Link>

          {/* Member avatars */}
          <div className="flex -space-x-2 shrink-0">
            {members.slice(0, 5).map(m => (
              <div
                key={m.id}
                title={m.profiles?.full_name ?? m.profiles?.email ?? 'Member'}
                className="h-8 w-8 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center text-xs font-semibold text-primary uppercase"
              >
                {(m.profiles?.full_name?.[0] ?? m.profiles?.email?.[0] ?? '?')}
              </div>
            ))}
            {members.length > 5 && (
              <div className="h-8 w-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs font-semibold text-muted-foreground">
                +{members.length - 5}
              </div>
            )}
          </div>
          </div>
        </header>

        {/* Cover photo */}
        {trip.cover_photo_url && (
          <div className="w-full h-28 overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={trip.cover_photo_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Scrollable page content */}
        <div className="flex-1 overflow-auto">
          <TripRealtimeSync tripId={tripId} />
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
