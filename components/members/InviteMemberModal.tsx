'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { MemberRole } from '@/types'

export default function InviteMemberModal({ tripId }: { tripId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('editor')
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResult({ type: 'error', message: data.error ?? 'Failed to invite member.' })
      } else {
        setResult({ type: 'success', message: `${email} has been added to the trip.` })
        setEmail('')
        router.refresh()
      }
    } catch {
      setResult({ type: 'error', message: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setResult(null) }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">+ Invite member</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Invite a member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="email">Email address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={role}
              onChange={e => setRole(e.target.value as MemberRole)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="editor">Editor — can add and edit events</option>
              <option value="viewer">Viewer — read-only access</option>
            </select>
          </div>

          {result && (
            <p className={`text-sm ${result.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
              {result.message}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Close</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Inviting…' : 'Invite'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
