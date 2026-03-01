import { adminSupabase as supabase } from '@/lib/supabase/admin'
import type { ChecklistItem, ChecklistCategory, Place, PlaceCategory } from '@/types'

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
  updates: Partial<Pick<Place, 'name' | 'location' | 'notes' | 'status' | 'rating' | 'url' | 'category'>>
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
