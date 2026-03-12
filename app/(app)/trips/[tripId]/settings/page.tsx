import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import * as TripController from '@/controllers/trip.controller'
import TripSettingsClient from './TripSettingsClient'

export default async function SettingsPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { trip, members } = await TripController.getTripWithMembers(tripId)
  if (!trip) redirect('/trips')

  const currentMember = members.find(m => m.user_id === user.id)
  if (!currentMember) redirect('/trips')

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">Trip Settings</h1>
      <TripSettingsClient
        trip={trip}
        role={currentMember.role}
      />
    </div>
  )
}
