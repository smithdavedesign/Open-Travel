import { adminSupabase as supabase } from '@/lib/supabase/admin'
import type { Trip, TripMember } from '@/types'

export async function getTripsByUser(userId: string): Promise<Trip[]> {
  const { data: memberships, error: memberError } = await supabase
    .from('trip_members')
    .select('trip_id')
    .eq('user_id', userId)

  if (memberError) throw memberError
  if (!memberships?.length) return []

  const tripIds = memberships.map(m => m.trip_id)

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .in('id', tripIds)
    .order('start_date', { ascending: true, nullsFirst: false })

  if (error) throw error
  return data
}

export async function getTripById(tripId: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single()

  if (error) throw error
  return data
}

export async function createTrip(
  trip: Omit<Trip, 'id' | 'created_at' | 'updated_at'>
): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .insert(trip)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTrip(tripId: string, updates: Partial<Trip>): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', tripId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTrip(tripId: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', tripId)
  if (error) throw error
}

export async function getTripMembers(tripId: string): Promise<TripMember[]> {
  const { data, error } = await supabase
    .from('trip_members')
    .select('*, profiles(id, full_name, email, avatar_url)')
    .eq('trip_id', tripId)

  if (error) throw error
  return data
}

export async function addTripMember(
  tripId: string,
  userId: string,
  role: TripMember['role'] = 'editor'
): Promise<TripMember> {
  const { data, error } = await supabase
    .from('trip_members')
    .insert({ trip_id: tripId, user_id: userId, role })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMemberRole(
  tripId: string,
  userId: string,
  role: TripMember['role']
): Promise<void> {
  const { error } = await supabase
    .from('trip_members')
    .update({ role })
    .eq('trip_id', tripId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function removeTripMember(tripId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('trip_members')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function getTripByShareToken(token: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('share_token', token)
    .single()

  if (error) return null
  return data
}
