'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import DocumentUpload from '@/components/documents/DocumentUpload'
import DocumentList from '@/components/documents/DocumentList'
import ParseReviewModal from '@/components/documents/ParseReviewModal'
import type { Document, ParsedEventData } from '@/types'

interface UploadResult {
  document: Document
  parsed: ParsedEventData | null
  requiresReview: boolean
}

interface PendingReview {
  document: Document
  parsed: ParsedEventData
  requiresReview: boolean
}

export default function DocumentsPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingReview, setPendingReview] = useState<PendingReview | null>(null)

  useEffect(() => {
    fetch(`/api/trips/${tripId}/documents`)
      .then(r => r.json())
      .then(data => { setDocuments(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [tripId])

  const handleUploadComplete = (result: UploadResult) => {
    setDocuments(prev => [result.document, ...prev])
    if (result.parsed) {
      setPendingReview({
        document: result.document,
        parsed: result.parsed,
        requiresReview: result.requiresReview,
      })
    }
  }

  const handleReviewClose = () => {
    setPendingReview(null)
    // Refresh list to pick up any status changes
    fetch(`/api/trips/${tripId}/documents`)
      .then(r => r.json())
      .then(setDocuments)
      .catch(() => {})
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Documents</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Upload booking confirmations and itineraries — Claude will parse them into trip events automatically.
        </p>
      </div>

      <DocumentUpload tripId={tripId} onComplete={handleUploadComplete} />

      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-3">Uploaded files</h3>
        {loading ? (
          <p className="text-sm text-slate-400 text-center py-8">Loading…</p>
        ) : (
          <DocumentList documents={documents} />
        )}
      </div>

      {pendingReview && (
        <ParseReviewModal
          document={pendingReview.document}
          parsed={pendingReview.parsed}
          requiresReview={pendingReview.requiresReview}
          tripId={tripId}
          onClose={handleReviewClose}
        />
      )}
    </div>
  )
}
