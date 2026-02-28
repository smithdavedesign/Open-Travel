import { createClient } from '@/lib/supabase/server'
import * as DocumentController from '@/controllers/document.controller'
import { requireTripRole, ForbiddenError } from '@/lib/auth/rbac'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { documentId, tripId, parsed } = await request.json()

    if (!documentId || !tripId || !parsed) {
      return NextResponse.json({ error: 'documentId, tripId and parsed are required' }, { status: 400 })
    }

    await requireTripRole(tripId, user.id, 'editor')
    const event = await DocumentController.confirmAndSaveEvent(tripId, user.id, documentId, parsed)
    return NextResponse.json(event, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[POST /api/parse-document/confirm] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
