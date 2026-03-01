'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { FileText, CheckCircle2, Clock, Upload } from 'lucide-react'
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
  const [loading, setLoading]     = useState(true)
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
      setPendingReview({ document: result.document, parsed: result.parsed, requiresReview: result.requiresReview })
    }
  }

  const handleReviewClose = () => {
    setPendingReview(null)
    fetch(`/api/trips/${tripId}/documents`).then(r => r.json()).then(setDocuments).catch(() => {})
  }

  const total       = documents.length
  const verified    = documents.filter(d => d.event_id).length
  const needsReview = documents.filter(d => d.parsed_at && !d.event_id).length
  const uploaded    = documents.filter(d => !d.parsed_at && !d.event_id).length

  const stats = [
    { label: 'Total Documents', value: total,       icon: FileText,    color: 'text-primary',    bg: 'bg-primary/10' },
    { label: 'Verified',        value: verified,    icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Needs Review',    value: needsReview, icon: Clock,       color: 'text-amber-600',  bg: 'bg-amber-50' },
    { label: 'Uploaded',        value: uploaded,    icon: Upload,      color: 'text-muted-foreground', bg: 'bg-muted' },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Documents</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          AI-powered document parsing for automatic itinerary creation
        </p>
      </div>

      {/* Drop zone */}
      <DocumentUpload tripId={tripId} onComplete={handleUploadComplete} />

      {/* Stats row — only shown when docs exist */}
      {documents.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-card rounded-xl border p-4 flex items-center gap-3">
              <div className={`${bg} rounded-lg p-2 shrink-0`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
                <p className="text-xs text-muted-foreground leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document list */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Uploaded Documents</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
        ) : (
          <DocumentList
            documents={documents}
            tripId={tripId}
            onDelete={id => setDocuments(prev => prev.filter(d => d.id !== id))}
          />
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
