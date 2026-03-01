'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MemberList from '@/components/members/MemberList'
import InviteMemberModal from '@/components/members/InviteMemberModal'
import type { Trip, TripMember, TripStatus } from '@/types'

const STATUSES: TripStatus[] = ['planning', 'active', 'completed', 'archived']

export default function TripSettingsPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [members, setMembers] = useState<TripMember[]>([])
  const [loading, setLoading] = useState(true)

  // Trip edit form
  const [tripForm, setTripForm] = useState({
    name: '', destinations: '', start_date: '', end_date: '', status: 'planning' as TripStatus,
  })
  const [savingTrip, setSavingTrip] = useState(false)
  const [tripError, setTripError] = useState<string | null>(null)
  const [tripSaved, setTripSaved] = useState(false)

  // Danger zone
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Other section states
  const [duplicating, setDuplicating] = useState(false)
  const [sharingLoading, setSharingLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
  }, [])

  const fetchData = async () => {
    const [tripRes, membersRes] = await Promise.all([
      fetch(`/api/trips/${tripId}`),
      fetch(`/api/trips/${tripId}/members`),
    ])
    const [{ trip: t }, m] = await Promise.all([tripRes.json(), membersRes.json()])
    setTrip(t)
    setMembers(m)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [tripId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Seed form when trip loads
  useEffect(() => {
    if (!trip) return
    setTripForm({
      name: trip.name,
      destinations: trip.destinations.join(', '),
      start_date: trip.start_date ?? '',
      end_date: trip.end_date ?? '',
      status: trip.status,
    })
  }, [trip])

  const isOwner = members.find(m => m.user_id === currentUserId)?.role === 'owner'

  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setTripForm(f => ({ ...f, [field]: e.target.value }))

  const handleSaveTrip = async () => {
    setSavingTrip(true)
    setTripError(null)
    const destinations = tripForm.destinations.split(',').map(d => d.trim()).filter(Boolean)
    const res = await fetch(`/api/trips/${tripId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: tripForm.name,
        destinations,
        start_date: tripForm.start_date || null,
        end_date: tripForm.end_date || null,
        status: tripForm.status,
      }),
    })
    if (!res.ok) {
      const d = await res.json()
      setTripError(d.error ?? 'Failed to save')
    } else {
      setTripSaved(true)
      setTimeout(() => setTripSaved(false), 2000)
      await fetchData()
    }
    setSavingTrip(false)
  }

  const handleDeleteTrip = async () => {
    setDeleting(true)
    await fetch(`/api/trips/${tripId}`, { method: 'DELETE' })
    router.push('/trips')
  }

  const handleDuplicate = async () => {
    setDuplicating(true)
    const res = await fetch(`/api/trips/${tripId}/duplicate`, { method: 'POST' })
    if (res.ok) {
      const newTrip = await res.json()
      router.push(`/trips/${newTrip.id}`)
    }
    setDuplicating(false)
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverUploading(true)
    setCoverError(null)
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`/api/trips/${tripId}/cover-photo`, { method: 'POST', body: formData })
    if (res.ok) {
      const { cover_photo_url } = await res.json()
      setTrip(prev => prev ? { ...prev, cover_photo_url } : prev)
    } else {
      const data = await res.json()
      setCoverError(data.error ?? 'Upload failed')
    }
    setCoverUploading(false)
    e.target.value = ''
  }

  const handleRemoveCover = async () => {
    setCoverUploading(true)
    await fetch(`/api/trips/${tripId}/cover-photo`, { method: 'DELETE' })
    setTrip(prev => prev ? { ...prev, cover_photo_url: null } : prev)
    setCoverUploading(false)
  }

  const handleGenerateShareLink = async () => {
    setSharingLoading(true)
    const res = await fetch(`/api/trips/${tripId}/share`, { method: 'POST' })
    if (res.ok) fetchData()
    setSharingLoading(false)
  }

  const handleRevokeShareLink = async () => {
    setSharingLoading(true)
    await fetch(`/api/trips/${tripId}/share`, { method: 'DELETE' })
    fetchData()
    setSharingLoading(false)
  }

  const shareUrl = trip?.share_token
    ? `${window.location.origin}/share/trips/${trip.share_token}`
    : null

  const handleCopy = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <p className="text-sm text-slate-400 py-8 text-center">Loading…</p>
  if (!trip) return null

  return (
    <div className="space-y-8 max-w-xl">
      {/* Members */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Members</h2>
            <p className="text-sm text-slate-500 mt-0.5">{members.length} member{members.length === 1 ? '' : 's'}</p>
          </div>
          {isOwner && <InviteMemberModal tripId={tripId} />}
        </div>
        <MemberList
          members={members}
          currentUserId={currentUserId ?? ''}
          tripId={tripId}
          isOwner={isOwner}
          onMembersChange={fetchData}
        />
        {!isOwner && (
          <p className="text-xs text-slate-400 mt-4">Only the trip owner can invite or manage members.</p>
        )}
      </section>

      {/* Trip details — editable */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Trip details</h2>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="trip-name">Name</Label>
            <Input id="trip-name" value={tripForm.name} onChange={setField('name')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="trip-destinations">
              Destinations <span className="text-slate-400 font-normal">(comma-separated)</span>
            </Label>
            <Input
              id="trip-destinations"
              value={tripForm.destinations}
              onChange={setField('destinations')}
              placeholder="Paris, Rome, Barcelona"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="trip-start">Start date</Label>
              <Input id="trip-start" type="date" value={tripForm.start_date} onChange={setField('start_date')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="trip-end">End date</Label>
              <Input id="trip-end" type="date" value={tripForm.end_date} onChange={setField('end_date')} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="trip-status">Status</Label>
            <select
              id="trip-status"
              value={tripForm.status}
              onChange={setField('status')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {STATUSES.map(s => (
                <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {tripError && <p className="text-sm text-red-500">{tripError}</p>}

          <div className="flex justify-end pt-1">
            <Button onClick={handleSaveTrip} disabled={savingTrip}>
              {savingTrip ? 'Saving…' : tripSaved ? 'Saved!' : 'Save changes'}
            </Button>
          </div>
        </div>
      </section>

      {/* Cover photo */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Cover photo</h2>
        <p className="text-sm text-slate-500 mb-4">
          Shown at the top of the trip page. JPG, PNG or WebP — max 5 MB.
        </p>

        {trip.cover_photo_url && (
          <div className="mb-4 relative w-full h-32 rounded-xl overflow-hidden bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={trip.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-center gap-3">
          <label className="cursor-pointer">
            <span className="inline-flex items-center px-3 py-1.5 rounded-md border border-slate-200 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">
              {coverUploading ? 'Uploading…' : trip.cover_photo_url ? 'Change photo' : 'Upload photo'}
            </span>
            <input type="file" accept="image/*" className="sr-only" disabled={coverUploading} onChange={handleCoverUpload} />
          </label>
          {trip.cover_photo_url && !coverUploading && (
            <button onClick={handleRemoveCover} className="text-sm text-red-400 hover:text-red-600">
              Remove
            </button>
          )}
        </div>
        {coverError && <p className="text-xs text-red-500 mt-2">{coverError}</p>}
      </section>

      {/* Share trip */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Share trip</h2>
        <p className="text-sm text-slate-500 mb-4">
          Generate a read-only public link anyone can view — no sign-in required.
        </p>

        {shareUrl ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 font-mono"
              />
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            {isOwner && (
              <button
                onClick={handleRevokeShareLink}
                disabled={sharingLoading}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Revoke link
              </button>
            )}
          </div>
        ) : (
          isOwner ? (
            <Button variant="outline" onClick={handleGenerateShareLink} disabled={sharingLoading}>
              {sharingLoading ? 'Generating…' : 'Generate share link'}
            </Button>
          ) : (
            <p className="text-sm text-slate-400">Only the trip owner can generate a share link.</p>
          )
        )}
      </section>

      {/* Duplicate trip */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Duplicate trip</h2>
        <p className="text-sm text-slate-500 mb-4">
          Creates a copy with the same name, destinations, and dates — no events or expenses carried over.
        </p>
        <Button variant="outline" onClick={handleDuplicate} disabled={duplicating}>
          {duplicating ? 'Duplicating…' : 'Duplicate this trip'}
        </Button>
      </section>

      {/* Danger zone — owner only */}
      {isOwner && (
        <section className="bg-white rounded-2xl border border-red-200 p-6">
          <h2 className="text-base font-semibold text-red-700 mb-1">Danger zone</h2>
          <p className="text-sm text-slate-500 mb-4">
            Permanently delete this trip and all its events, expenses, and documents. This cannot be undone.
          </p>
          {confirmDelete ? (
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-sm text-red-600 font-medium">Are you sure?</p>
              <Button variant="destructive" onClick={handleDeleteTrip} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Yes, delete trip'}
              </Button>
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </div>
          ) : (
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              Delete trip
            </Button>
          )}
        </section>
      )}
    </div>
  )
}
