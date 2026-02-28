import { adminSupabase as supabase } from '@/lib/supabase/admin'
import type { Event, EventType } from '@/types'

export async function getEventsByTrip(tripId: string): Promise<Event[]> {
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('trip_id', tripId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error
  return data
}

export async function getEventById(eventId: string): Promise<Event | null> {
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (error) throw error
  return data
}

export async function createEvent(
  event: Omit<Event, 'id' | 'created_at' | 'updated_at'>
): Promise<Event> {
  
  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
  
  const { data, error } = await supabase
    .from('events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', eventId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteEvent(eventId: string): Promise<void> {
  
  const { error } = await supabase.from('events').delete().eq('id', eventId)
  if (error) throw error
}

export async function getEventsByTypeAndTrip(
  tripId: string,
  type: EventType
): Promise<Event[]> {
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('trip_id', tripId)
    .eq('type', type)
    .order('date', { ascending: true })

  if (error) throw error
  return data
}
