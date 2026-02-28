import { createClient } from '@/lib/supabase/server'
import * as TripController from '@/controllers/trip.controller'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId } = await params
  const result = await TripController.getTripWithMembers(tripId)
  return NextResponse.json(result)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId } = await params
  const body = await request.json()
  const trip = await TripController.updateTrip(tripId, body)
  return NextResponse.json(trip)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId } = await params
  await TripController.deleteTrip(tripId)
  return NextResponse.json({ success: true })
}
