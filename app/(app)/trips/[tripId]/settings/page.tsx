'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import MemberList from '@/components/members/MemberList'
import InviteMemberModal from '@/components/members/InviteMemberModal'
import type { Trip, TripMember } from '@/types'
import { useEffect } from 'react'

export default function TripSettingsPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [members, setMembers] = useState<TripMember[]>([])
  const [loading, setLoading] = useState(true)
  const [duplicating, setDuplicating] = useState(false)
  const [sharingLoading, setSharingLoading] = useState(false)
  const [copied, setCopied] = useState(false)

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

  useEffect(() => { fetchData() }, [tripId])

  const isOwner = members.find(m => m.user_id === currentUserId)?.role === 'owner'

  const handleDuplicate = async () => {
    setDuplicating(true)
    const res = await fetch(`/api/trips/${tripId}/duplicate`, { method: 'POST' })
    if (res.ok) {
      const newTrip = await res.json()
      router.push(`/trips/${newTrip.id}`)
    }
    setDuplicating(false)
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
        <MemberList members={members} currentUserId={currentUserId ?? ''} />
        {!isOwner && (
          <p className="text-xs text-slate-400 mt-4">Only the trip owner can invite members.</p>
        )}
      </section>

      {/* Trip details */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Trip details</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Name</dt>
            <dd className="font-medium text-slate-900">{trip.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Destinations</dt>
            <dd className="font-medium text-slate-900">{trip.destinations.join(', ') || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Status</dt>
            <dd className="font-medium text-slate-900 capitalize">{trip.status}</dd>
          </div>
          {trip.start_date && (
            <div className="flex justify-between">
              <dt className="text-slate-500">Dates</dt>
              <dd className="font-medium text-slate-900">
                {trip.start_date}{trip.end_date ? ` – ${trip.end_date}` : ''}
              </dd>
            </div>
          )}
        </dl>
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
    </div>
  )
}
