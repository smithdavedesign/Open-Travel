'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ActivityFeedItem } from '@/types'

const ACTION_ICONS: Record<string, string> = {
  added_event: '🗓️',
  confirmed_document: '📄',
  added_expense: '💸',
  recorded_settlement: '✅',
  uploaded_document: '📎',
  invited_member: '👤',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function describeAction(item: ActivityFeedItem): string {
  const m = item.metadata
  switch (item.action) {
    case 'added_event':
      return `added ${String(m.type ?? 'event')} · ${String(m.title ?? '')}`
    case 'confirmed_document':
      return `parsed ${String(m.document_name ?? 'doc')} → ${String(m.event_title ?? 'event')}`
    case 'added_expense':
      return `logged ${String(m.title ?? 'expense')} · ${new Intl.NumberFormat('en-US', {
        style: 'currency', currency: String(m.currency ?? 'USD'), maximumFractionDigits: 0,
      }).format(Number(m.amount ?? 0))}`
    case 'recorded_settlement':
      return `recorded a payment · ${new Intl.NumberFormat('en-US', {
        style: 'currency', currency: String(m.currency ?? 'USD'), maximumFractionDigits: 0,
      }).format(Number(m.amount ?? 0))}`
    case 'uploaded_document':
      return `uploaded ${String(m.name ?? 'a file')}`
    case 'invited_member':
      return `added a new member`
    default:
      return item.action.replace(/_/g, ' ')
  }
}

export default function ActivityFeed({ tripId }: { tripId: string }) {
  const [items, setItems] = useState<ActivityFeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/trips/${tripId}/activity`)
      .then(r => r.json())
      .then(data => { setItems(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [tripId])

  // Subscribe to new activity items in real-time
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`activity:${tripId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_feed', filter: `trip_id=eq.${tripId}` },
        payload => {
          setItems(prev => [payload.new as ActivityFeedItem, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tripId])

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Activity</h3>

      {loading ? (
        <p className="text-xs text-slate-400 text-center py-4">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">No activity yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map(item => {
            const name = item.profiles?.full_name ?? 'Someone'
            const avatar = item.profiles?.full_name?.[0]?.toUpperCase() ?? '?'
            return (
              <li key={item.id} className="flex items-start gap-2.5">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 shrink-0 mt-0.5">
                  {avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 leading-snug">
                    <span className="font-medium">{name}</span>
                    {' '}
                    <span className="text-slate-500">{describeAction(item)}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{timeAgo(item.created_at)}</p>
                </div>
                <span className="text-sm shrink-0">{ACTION_ICONS[item.action] ?? '•'}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
