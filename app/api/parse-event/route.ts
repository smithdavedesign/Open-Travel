import { createClient } from '@/lib/supabase/server'
import { parseDocumentImage, parseDocumentText } from '@/lib/claude/parser'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/parse-event
 *
 * Lightweight parse-only endpoint — no storage, no document record.
 * Accepts a single file (image or PDF) and returns ParsedEventData.
 * Used by AddEventModal to pre-fill the event form from a booking confirmation.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 })

  try {
    let parsed

    if (file.type.startsWith('image/')) {
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
      parsed = await parseDocumentImage(base64, mediaType)
    } else if (file.type === 'application/pdf') {
      // PDF text extraction is a TODO — pass filename as hint for now
      parsed = await parseDocumentText(`[PDF document: ${file.name}]`)
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Use an image or PDF.' }, { status: 415 })
    }

    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Failed to parse document' }, { status: 500 })
  }
}
