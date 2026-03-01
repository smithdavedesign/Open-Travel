'use client'

import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
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
  const [dragging, setDragging]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')

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
      const res  = await fetch('/api/parse-document', { method: 'POST', body: form })
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
          dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/50'
        } ${uploading ? 'opacity-50 cursor-wait' : ''}`}
      >
        <div className="flex justify-center mb-3">
          <div className="bg-primary/10 rounded-full p-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
        </div>
        {uploading ? (
          <p className="text-sm font-medium text-primary">Uploading &amp; parsing…</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-foreground">Drop your travel documents here</p>
            <p className="text-xs text-muted-foreground mt-1">Or click to browse · PDF, PNG, JPG up to 10MB</p>
            <Button size="sm" variant="outline" className="mt-4 pointer-events-none" tabIndex={-1}>
              Select Files
            </Button>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} className="hidden" onChange={onInputChange} />
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  )
}
