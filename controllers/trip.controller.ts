import * as TripModel from '@/models/trip.model'
import { logActivity } from '@/controllers/activity.controller'
import type { Trip, TripMember } from '@/types'

export async function getUserTrips(userId: string) {
  return TripModel.getTripsByUser(userId)
}

export async function getTripWithMembers(tripId: string) {
  const [trip, members] = await Promise.all([
    TripModel.getTripById(tripId),
    TripModel.getTripMembers(tripId),
  ])
  return { trip, members }
}

export async function createTrip(
  ownerId: string,
  data: Pick<Trip, 'name' | 'destinations' | 'start_date' | 'end_date' | 'description' | 'cover_photo_url'>
) {
  return TripModel.createTrip({
    ...data,
    owner_id: ownerId,
    status: 'planning',
    forwarding_address: null,
  })
}

export async function updateTrip(tripId: string, updates: Partial<Trip>) {
  return TripModel.updateTrip(tripId, updates)
}

export async function deleteTrip(tripId: string) {
  return TripModel.deleteTrip(tripId)
}

export async function inviteMemberByUserId(
  tripId: string,
  userId: string,
  role: TripMember['role'] = 'editor',
  invitedBy?: string
) {
  const member = await TripModel.addTripMember(tripId, userId, role)
  if (invitedBy) {
    logActivity({
      tripId, userId: invitedBy, action: 'invited_member',
      entityType: 'profile', entityId: userId,
      metadata: { invited_user_id: userId, role },
    })
  }
  return member
}

export async function updateMemberRole(
  tripId: string,
  userId: string,
  role: TripMember['role']
) {
  return TripModel.updateMemberRole(tripId, userId, role)
}

export async function removeMember(tripId: string, userId: string) {
  return TripModel.removeTripMember(tripId, userId)
}

export async function duplicateTrip(tripId: string, newOwnerId: string): Promise<Trip> {
  const trip = await TripModel.getTripById(tripId)
  if (!trip) throw new Error('Trip not found')
  return TripModel.createTrip({
    name: `${trip.name} (copy)`,
    destinations: trip.destinations,
    start_date: trip.start_date,
    end_date: trip.end_date,
    description: trip.description,
    cover_photo_url: null,
    status: 'planning',
    owner_id: newOwnerId,
    forwarding_address: null,
    budget: trip.budget,
    budget_currency: trip.budget_currency,
    share_token: null,
  })
}

export async function generateShareToken(tripId: string): Promise<Trip> {
  return TripModel.updateTrip(tripId, { share_token: crypto.randomUUID() })
}

export async function revokeShareToken(tripId: string): Promise<Trip> {
  return TripModel.updateTrip(tripId, { share_token: null })
}

export async function getTripByShareToken(token: string) {
  return TripModel.getTripByShareToken(token)
}
