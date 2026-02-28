'use client'

import { useState } from 'react'
import type { Document } from '@/types'

function fileIcon(type: string) {
  if (type === 'application/pdf') return '📄'
  if (type.startsWith('image/')) return '🖼️'
  return '📎'
}

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

interface ViewState {
  url: string
  name: string
  fileType: string
}

function DocumentPreviewModal({ view, onClose }: { view: ViewState; onClose: () => void }) {
  const isImage = view.fileType.startsWith('image/')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-medium text-slate-900 truncate">{view.name}</p>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <a
              href={view.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Open in new tab
            </a>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50 p-4">
          {isImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={view.url}
              alt={view.name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          ) : (
            <div className="text-center space-y-4 py-12">
              <p className="text-5xl">📄</p>
              <p className="text-sm text-slate-600 font-medium">{view.name}</p>
              <a
                href={view.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Open / Download
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DocumentList({
  documents,
  tripId,
  onDelete,
}: {
  documents: Document[]
  tripId: string
  onDelete?: (id: string) => void
}) {
  const [viewing, setViewing] = useState<ViewState | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleView = async (doc: Document) => {
    setLoadingId(doc.id)
    try {
      const res = await fetch(`/api/trips/${tripId}/documents/${doc.id}`)
      const data = await res.json()
      if (data.url) {
        setViewing({ url: data.url, name: doc.name, fileType: doc.file_type })
      }
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Delete "${doc.name}"? This cannot be undone.`)) return
    setDeletingId(doc.id)
    await fetch(`/api/trips/${tripId}/documents/${doc.id}`, { method: 'DELETE' })
    onDelete?.(doc.id)
    setDeletingId(null)
  }

  if (documents.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">No documents uploaded yet.</p>
  }

  return (
    <>
      <ul className="divide-y divide-slate-100">
        {documents.map(doc => (
          <li key={doc.id} className="flex items-center gap-3 py-3">
            <span className="text-xl">{fileIcon(doc.file_type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
              <p className="text-xs text-slate-400">{fileSize(doc.file_size)}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {doc.event_id ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  Linked to event
                </span>
              ) : doc.parsed_at ? (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  Parsed
                </span>
              ) : (
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                  Uploaded
                </span>
              )}

              <button
                onClick={() => handleView(doc)}
                disabled={loadingId === doc.id}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
              >
                {loadingId === doc.id ? 'Loading…' : 'View'}
              </button>

              {onDelete && (
                <button
                  onClick={() => handleDelete(doc)}
                  disabled={deletingId === doc.id}
                  className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-50"
                >
                  {deletingId === doc.id ? '…' : 'Delete'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {viewing && (
        <DocumentPreviewModal view={viewing} onClose={() => setViewing(null)} />
      )}
    </>
  )
}
