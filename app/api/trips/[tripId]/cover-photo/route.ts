import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { requireTripRole, ForbiddenError } from '@/lib/auth/rbac'
import * as TripModel from '@/models/trip.model'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tripId } = await params
    await requireTripRole(tripId, user.id, 'editor')

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    // Max 5 MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 5 MB' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const filePath = `covers/${tripId}/cover.${ext}`
    const bytes = await file.arrayBuffer()

    const { error: uploadError } = await adminSupabase.storage
      .from('trip-documents')
      .upload(filePath, bytes, { contentType: file.type, upsert: true })

    if (uploadError) throw uploadError

    // Signed URL with 1-year expiry (365 days × 86400 s)
    const { data: urlData, error: urlError } = await adminSupabase.storage
      .from('trip-documents')
      .createSignedUrl(filePath, 365 * 86400)

    if (urlError || !urlData) throw urlError ?? new Error('Failed to create signed URL')

    const trip = await TripModel.updateTrip(tripId, { cover_photo_url: urlData.signedUrl })

    return NextResponse.json({ cover_photo_url: trip.cover_photo_url })
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tripId } = await params
    await requireTripRole(tripId, user.id, 'editor')

    await TripModel.updateTrip(tripId, { cover_photo_url: null })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
