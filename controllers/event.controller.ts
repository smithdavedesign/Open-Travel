import * as EventModel from '@/models/event.model'
import { logActivity } from '@/controllers/activity.controller'
import type { Event, ParsedEventData } from '@/types'

export async function getTripTimeline(tripId: string): Promise<Record<string, Event[]>> {
  const events = await EventModel.getEventsByTrip(tripId)

  // Group events by date for timeline rendering
  return events.reduce<Record<string, Event[]>>((acc, event) => {
    if (!acc[event.date]) acc[event.date] = []
    acc[event.date].push(event)
    return acc
  }, {})
}

export async function createEvent(
  tripId: string,
  userId: string,
  data: Omit<Event, 'id' | 'trip_id' | 'created_by' | 'created_at' | 'updated_at'>
): Promise<Event> {
  const event = await EventModel.createEvent({
    ...data,
    trip_id: tripId,
    created_by: userId,
  })
  logActivity({
    tripId, userId, action: 'added_event', entityType: 'event', entityId: event.id,
    metadata: { title: event.title, type: event.type, date: event.date },
  })
  return event
}

export async function addEventFromParsedData(
  tripId: string,
  userId: string,
  parsed: ParsedEventData,
  documentName?: string
): Promise<Event> {
  const event = await EventModel.createEvent({
    trip_id: tripId,
    created_by: userId,
    type: parsed.type,
    title: parsed.title,
    date: parsed.date,
    start_time: parsed.start_time ?? null,
    end_time: parsed.end_time ?? null,
    location: parsed.location ?? null,
    confirmation_code: parsed.confirmation_code ?? null,
    cost: parsed.cost ?? null,
    currency: parsed.currency ?? 'USD',
    notes: parsed.notes ?? null,
    data: parsed.data,
  })
  logActivity({
    tripId, userId, action: 'confirmed_document', entityType: 'event', entityId: event.id,
    metadata: { event_title: event.title, document_name: documentName ?? 'document' },
  })
  return event
}

export async function updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
  return EventModel.updateEvent(eventId, updates)
}

export async function deleteEvent(eventId: string): Promise<void> {
  return EventModel.deleteEvent(eventId)
}
