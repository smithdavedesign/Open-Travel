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

export default function DocumentList({ documents }: { documents: Document[] }) {
  if (documents.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">No documents uploaded yet.</p>
  }

  return (
    <ul className="divide-y divide-slate-100">
      {documents.map(doc => (
        <li key={doc.id} className="flex items-center gap-3 py-3">
          <span className="text-xl">{fileIcon(doc.file_type)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
            <p className="text-xs text-slate-400">{fileSize(doc.file_size)}</p>
          </div>
          <div className="shrink-0">
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
          </div>
        </li>
      ))}
    </ul>
  )
}
