import { adminSupabase as supabase } from '@/lib/supabase/admin'
import type { Document } from '@/types'

export async function getDocumentsByTrip(tripId: string): Promise<Document[]> {
  
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getDocumentById(documentId: string): Promise<Document | null> {
  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single()
  return data
}

export async function createDocument(
  document: Omit<Document, 'id' | 'created_at'>
): Promise<Document> {
  
  const { data, error } = await supabase
    .from('documents')
    .insert(document)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function markDocumentParsed(documentId: string): Promise<void> {
  
  const { error } = await supabase
    .from('documents')
    .update({ parsed_at: new Date().toISOString() })
    .eq('id', documentId)

  if (error) throw error
}

export async function deleteDocument(documentId: string): Promise<void> {
  
  const { error } = await supabase.from('documents').delete().eq('id', documentId)
  if (error) throw error
}

export async function getSignedUrl(filePath: string): Promise<string> {
  
  const { data, error } = await supabase.storage
    .from('trip-documents')
    .createSignedUrl(filePath, 3600) // 1-hour expiry

  if (error) throw error
  return data.signedUrl
}
