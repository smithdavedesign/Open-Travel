import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { requireTripRole, ForbiddenError } from '@/lib/auth/rbac'
import * as DocumentModel from '@/models/document.model'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/trips/[tripId]/documents/[documentId]
// Returns a fresh signed URL for the document (1-hour expiry)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string; documentId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tripId, documentId } = await params
    await requireTripRole(tripId, user.id, 'viewer')

    const doc = await DocumentModel.getDocumentById(documentId)
    if (!doc || doc.trip_id !== tripId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data, error } = await adminSupabase.storage
      .from('trip-documents')
      .createSignedUrl(doc.file_path, 3600) // 1-hour

    if (error || !data) throw error ?? new Error('Failed to create signed URL')

    return NextResponse.json({ url: data.signedUrl, name: doc.name, file_type: doc.file_type })
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/trips/[tripId]/documents/[documentId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string; documentId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tripId, documentId } = await params
    await requireTripRole(tripId, user.id, 'editor')

    const doc = await DocumentModel.getDocumentById(documentId)
    if (!doc || doc.trip_id !== tripId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Delete from storage
    await adminSupabase.storage.from('trip-documents').remove([doc.file_path])

    // Delete DB record
    await DocumentModel.deleteDocument(documentId)

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
