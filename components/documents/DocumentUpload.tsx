'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Document, ParsedEventData } from '@/types'

interface UploadResult {
  document: Document
  parsed: ParsedEventData | null
  requiresReview: boolean
}

interface Props {
  tripId: string
  onComplete: (result: UploadResult) => void
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']

export default function DocumentUpload({ tripId, onComplete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      setError('Only images (JPG, PNG, GIF, WebP) and PDFs are supported.')
      return
    }
    setError('')
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('tripId', tripId)

      const res = await fetch('/api/parse-document', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status})`)
      onComplete(data as UploadResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
          dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        } ${uploading ? 'opacity-50 cursor-wait' : ''}`}
      >
        <p className="text-3xl mb-2">📎</p>
        {uploading ? (
          <p className="text-sm font-medium text-blue-600">Uploading & parsing…</p>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-700">Drop a booking confirmation here</p>
            <p className="text-xs text-slate-400 mt-1">or click to browse — JPG, PNG, PDF supported</p>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} className="hidden" onChange={onInputChange} />
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  )
}
