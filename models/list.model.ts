import { adminSupabase as supabase } from '@/lib/supabase/admin'
import type { ChecklistItem, ChecklistCategory, Place, PlaceCategory, PlaceWithVotes } from '@/types'

// ── Checklist ──────────────────────────────────────────────────────────────

export async function getChecklistItems(tripId: string): Promise<ChecklistItem[]> {
  const { data, error } = await supabase
    .from('trip_checklist_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createChecklistItem(
  item: Omit<ChecklistItem, 'id' | 'created_at'>
): Promise<ChecklistItem> {
  const { data, error } = await supabase
    .from('trip_checklist_items')
    .insert(item)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateChecklistItem(
  itemId: string,
  updates: Partial<Pick<ChecklistItem, 'title' | 'notes' | 'quantity' | 'checked' | 'category'>>
): Promise<ChecklistItem> {
  const { data, error } = await supabase
    .from('trip_checklist_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteChecklistItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('trip_checklist_items')
    .delete()
    .eq('id', itemId)
  if (error) throw error
}

// ── Places ─────────────────────────────────────────────────────────────────

export async function getPlaces(tripId: string): Promise<Place[]> {
  const { data, error } = await supabase
    .from('trip_places')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createPlace(
  place: Omit<Place, 'id' | 'created_at'>
): Promise<Place> {
  const { data, error } = await supabase
    .from('trip_places')
    .insert(place)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePlace(
  placeId: string,
  updates: Partial<Pick<Place, 'name' | 'location' | 'lng' | 'lat' | 'notes' | 'status' | 'rating' | 'url' | 'category' | 'reservation_needed' | 'time_of_day' | 'duration' | 'meal_type'>>
): Promise<Place> {
  const { data, error } = await supabase
    .from('trip_places')
    .update(updates)
    .eq('id', placeId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePlace(placeId: string): Promise<void> {
  const { error } = await supabase
    .from('trip_places')
    .delete()
    .eq('id', placeId)
  if (error) throw error
}

// ── Place Votes ─────────────────────────────────────────────────────────────

export async function getPlacesWithVotes(tripId: string, userId: string): Promise<PlaceWithVotes[]> {
  const { data: places, error: placesError } = await supabase
    .from('trip_places')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })
  if (placesError) throw placesError

  if (places.length === 0) return []

  const { data: votes, error: votesError } = await supabase
    .from('place_votes')
    .select('place_id, user_id, vote')
    .in('place_id', places.map(p => p.id))
  if (votesError) throw votesError

  return places.map(place => {
    const placeVotes = votes?.filter(v => v.place_id === place.id) ?? []
    const vote_count = placeVotes.reduce((sum, v) => sum + v.vote, 0)
    const userVoteRow = placeVotes.find(v => v.user_id === userId)
    const user_vote = userVoteRow ? (userVoteRow.vote as 1 | -1) : null
    return { ...place, vote_count, user_vote }
  })
}

export async function upsertVote(placeId: string, userId: string, vote: 1 | -1): Promise<void> {
  const { error } = await supabase
    .from('place_votes')
    .upsert({ place_id: placeId, user_id: userId, vote }, { onConflict: 'place_id,user_id' })
  if (error) throw error
}

export async function deleteVote(placeId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('place_votes')
    .delete()
    .eq('place_id', placeId)
    .eq('user_id', userId)
  if (error) throw error
}
