'use client'

import { useState } from 'react'
import type { TripMember, MemberRole } from '@/types'

const roleColor: Record<string, string> = {
  owner:  'bg-blue-100 text-blue-700',
  editor: 'bg-green-100 text-green-700',
  viewer: 'bg-slate-100 text-slate-600',
}

interface Props {
  members: TripMember[]
  currentUserId: string
  tripId?: string
  isOwner?: boolean
  onMembersChange?: () => void
}

export default function MemberList({ members, currentUserId, tripId, isOwner, onMembersChange }: Props) {
  const [updating, setUpdating] = useState<string | null>(null)

  async function handleRoleChange(userId: string, role: MemberRole) {
    if (!tripId) return
    setUpdating(userId)
    await fetch(`/api/trips/${tripId}/members/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    setUpdating(null)
    onMembersChange?.()
  }

  return (
    <ul className="divide-y divide-slate-100">
      {members.map(m => {
        const name = m.profiles?.full_name ?? m.profiles?.email ?? 'Unknown'
        const email = m.profiles?.email ?? ''
        const initial = name[0]?.toUpperCase() ?? '?'
        const isYou = m.user_id === currentUserId
        const canChangeRole = isOwner && !isYou && m.role !== 'owner'

        return (
          <li key={m.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700">
                {initial}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {name} {isYou && <span className="text-slate-400 font-normal">(you)</span>}
                </p>
                {email && name !== email && (
                  <p className="text-xs text-slate-400">{email}</p>
                )}
              </div>
            </div>

            {canChangeRole ? (
              <select
                value={m.role}
                disabled={updating === m.user_id}
                onChange={e => handleRoleChange(m.user_id, e.target.value as MemberRole)}
                className="text-xs rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="editor">editor</option>
                <option value="viewer">viewer</option>
              </select>
            ) : (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleColor[m.role]}`}>
                {m.role}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
