import { createClient } from '@/lib/supabase/server'
import * as DocumentController from '@/controllers/document.controller'
import { requireTripRole, ForbiddenError } from '@/lib/auth/rbac'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const tripId = formData.get('tripId') as string | null

  if (!file || !tripId) {
    return NextResponse.json({ error: 'file and tripId are required' }, { status: 400 })
  }

  try {
    await requireTripRole(tripId, user.id, 'editor')
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    throw err
  }

  const { document, parsed } = await DocumentController.uploadAndParse(tripId, user.id, file)

  return NextResponse.json({
    document,
    parsed,
    requiresReview: parsed ? parsed.confidence < 0.85 : true,
  })
}
