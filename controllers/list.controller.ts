import * as ListModel from '@/models/list.model'
import type { ChecklistItem, ChecklistCategory, Place, PlaceCategory, PlaceStatus } from '@/types'

// ── Checklist ──────────────────────────────────────────────────────────────

export async function getChecklistItems(tripId: string): Promise<ChecklistItem[]> {
  return ListModel.getChecklistItems(tripId)
}

export async function createChecklistItem(
  tripId: string,
  userId: string,
  data: { title: string; category: ChecklistCategory; notes?: string; quantity?: number }
): Promise<ChecklistItem> {
  return ListModel.createChecklistItem({
    trip_id: tripId,
    created_by: userId,
    category: data.category,
    title: data.title,
    notes: data.notes ?? null,
    quantity: data.quantity ?? null,
    checked: false,
  })
}

export async function updateChecklistItem(
  itemId: string,
  updates: Partial<Pick<ChecklistItem, 'title' | 'notes' | 'quantity' | 'checked' | 'category'>>
): Promise<ChecklistItem> {
  return ListModel.updateChecklistItem(itemId, updates)
}

export async function deleteChecklistItem(itemId: string): Promise<void> {
  return ListModel.deleteChecklistItem(itemId)
}

// ── Places ─────────────────────────────────────────────────────────────────

export async function getPlaces(tripId: string): Promise<Place[]> {
  return ListModel.getPlaces(tripId)
}

export async function createPlace(
  tripId: string,
  userId: string,
  data: { name: string; category: PlaceCategory; location?: string; notes?: string; url?: string }
): Promise<Place> {
  return ListModel.createPlace({
    trip_id: tripId,
    created_by: userId,
    category: data.category,
    name: data.name,
    location: data.location ?? null,
    notes: data.notes ?? null,
    status: 'pending',
    rating: null,
    url: data.url ?? null,
  })
}

export async function updatePlace(
  placeId: string,
  updates: Partial<Pick<Place, 'name' | 'location' | 'notes' | 'status' | 'rating' | 'url' | 'category'>>
): Promise<Place> {
  return ListModel.updatePlace(placeId, updates)
}

export async function deletePlace(placeId: string): Promise<void> {
  return ListModel.deletePlace(placeId)
}
