import * as DocumentModel from '@/models/document.model'
import * as EventController from '@/controllers/event.controller'
import { logActivity } from '@/controllers/activity.controller'
import { parseDocumentText, parseDocumentImage } from '@/lib/claude/parser'
import { adminSupabase } from '@/lib/supabase/admin'
import type { Document, ParsedEventData } from '@/types'

export async function getTripDocuments(tripId: string) {
  return DocumentModel.getDocumentsByTrip(tripId)
}

export async function uploadAndParse(
  tripId: string,
  userId: string,
  file: File
): Promise<{ document: Document; parsed: ParsedEventData | null }> {
  const supabase = adminSupabase
  const filePath = `${tripId}/${Date.now()}-${file.name}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('trip-documents')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  // Save document record
  const document = await DocumentModel.createDocument({
    trip_id: tripId,
    event_id: null,
    name: file.name,
    file_path: filePath,
    file_type: file.type,
    file_size: file.size,
    parsed_at: null,
    uploaded_by: userId,
  })

  // Attempt AI parsing for images and PDFs
  let parsed: ParsedEventData | null = null

  try {
    if (file.type.startsWith('image/')) {
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
      parsed = await parseDocumentImage(base64, mediaType)
    } else if (file.type === 'application/pdf') {
      // For PDFs: extract text client-side or server-side; pass as text for now
      // TODO: add pdf-parse or similar for text extraction from PDFs
      const text = `[PDF document: ${file.name}]`
      parsed = await parseDocumentText(text)
    }

    if (parsed) {
      await DocumentModel.markDocumentParsed(document.id)
    }
  } catch {
    // Parsing failure is non-fatal — user can manually enter event details
    console.error('Document parsing failed for', file.name)
  }

  logActivity({
    tripId, userId, action: 'uploaded_document',
    entityType: 'document', entityId: document.id,
    metadata: { name: file.name, file_type: file.type },
  })

  return { document, parsed }
}

export async function confirmAndSaveEvent(
  tripId: string,
  userId: string,
  documentId: string,
  parsed: ParsedEventData
) {
  const doc = await DocumentModel.getDocumentById(documentId)
  const event = await EventController.addEventFromParsedData(tripId, userId, parsed, doc?.name)

  // Link document to the newly created event
  const supabase = adminSupabase
  await supabase.from('documents').update({ event_id: event.id }).eq('id', documentId)

  return event
}

export async function deleteDocument(documentId: string, filePath: string): Promise<void> {
  const supabase = adminSupabase
  await supabase.storage.from('trip-documents').remove([filePath])
  await DocumentModel.deleteDocument(documentId)
}

export async function getDocumentUrl(filePath: string): Promise<string> {
  return DocumentModel.getSignedUrl(filePath)
}
