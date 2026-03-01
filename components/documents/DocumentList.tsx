'use client'

import { useState } from 'react'
import { FileText, Image, Paperclip, Eye, Trash2, CheckCircle2, Clock, Link2 } from 'lucide-react'
import type { Document } from '@/types'

function fileIcon(type: string): React.ElementType {
  if (type === 'application/pdf') return FileText
  if (type.startsWith('image/')) return Image
  return Paperclip
}

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface ViewState { url: string; name: string; fileType: string }

function DocumentPreviewModal({ view, onClose }: { view: ViewState; onClose: () => void }) {
  const isImage = view.fileType.startsWith('image/')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <p className="text-sm font-medium text-foreground truncate">{view.name}</p>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <a href={view.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-medium">Open in new tab</a>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/30 p-4">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={view.url} alt={view.name} className="max-w-full max-h-full object-contain rounded-lg" />
          ) : (
            <div className="text-center space-y-4 py-12">
              <FileText className="h-14 w-14 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-foreground font-medium">{view.name}</p>
              <a href={view.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                Open / Download
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ doc }: { doc: Document }) {
  if (doc.event_id) return (
    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
      <CheckCircle2 className="h-3 w-3" />Verified
    </span>
  )
  if (doc.parsed_at) return (
    <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
      <Clock className="h-3 w-3" />Needs Review
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
      <Link2 className="h-3 w-3" />Uploaded
    </span>
  )
}

export default function DocumentList({ documents, tripId, onDelete }: {
  documents: Document[]
  tripId: string
  onDelete?: (id: string) => void
}) {
  const [viewing, setViewing]   = useState<ViewState | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleView = async (doc: Document) => {
    setLoadingId(doc.id)
    try {
      const res = await fetch(`/api/trips/${tripId}/documents/${doc.id}`)
      const data = await res.json()
      if (data.url) setViewing({ url: data.url, name: doc.name, fileType: doc.file_type })
    } finally { setLoadingId(null) }
  }

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Delete "${doc.name}"? This cannot be undone.`)) return
    setDeletingId(doc.id)
    await fetch(`/api/trips/${tripId}/documents/${doc.id}`, { method: 'DELETE' })
    onDelete?.(doc.id)
    setDeletingId(null)
  }

  if (documents.length === 0) {
    return <div className="text-center py-10 rounded-xl border border-dashed text-muted-foreground text-sm">No documents uploaded yet.</div>
  }

  return (
    <>
      <div className="space-y-3">
        {documents.map(doc => {
          const Icon = fileIcon(doc.file_type)
          const isImage = doc.file_type.startsWith('image/')
          return (
            <div key={doc.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border hover:shadow-sm transition-shadow">
              <div className={`rounded-lg p-2.5 shrink-0 ${isImage ? 'bg-pink-50' : 'bg-primary/10'}`}>
                <Icon className={`h-5 w-5 ${isImage ? 'text-pink-500' : 'text-primary'}`} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{fileSize(doc.file_size)}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-xs text-muted-foreground">Uploaded {fmtDate(doc.created_at)}</span>
                </div>
                {doc.event_id && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden max-w-[120px]">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '90%' }} />
                    </div>
                    <span className="text-[11px] text-green-600 font-medium">High confidence</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge doc={doc} />
                <button
                  onClick={() => handleView(doc)} disabled={loadingId === doc.id}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  title="View"
                >
                  <Eye className="h-4 w-4" />
                </button>
                {onDelete && (
                  <button
                    onClick={() => handleDelete(doc)} disabled={deletingId === doc.id}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {viewing && <DocumentPreviewModal view={viewing} onClose={() => setViewing(null)} />}
    </>
  )
}
