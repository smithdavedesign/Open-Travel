'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, Bell } from 'lucide-react'
import type { TripMember } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// CardHeader/CardTitle still used in activity sidebar
import ActivityFeed from '@/components/activity/ActivityFeed'
import InviteMemberModal from '@/components/members/InviteMemberModal'

const roleColor: Record<string, string> = {
  owner:  'bg-primary/10 text-primary',
  editor: 'bg-green-100 text-green-700',
  viewer: 'bg-slate-100 text-slate-600',
}

// Static notification data matching Figma design
const NOTIFICATIONS = [
  { id: '1', title: 'Trip budget updated', message: 'The trip budget has been set', time: '2 hours ago', read: false },
  { id: '2', title: 'New event added', message: 'A new event was added to the itinerary', time: '4 hours ago', read: false },
  { id: '3', title: 'Document uploaded', message: 'A booking confirmation was uploaded', time: '1 day ago', read: true },
  { id: '4', title: 'Member joined', message: 'A new member accepted the invitation', time: '2 days ago', read: true },
]

export default function CollaborationPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const [members, setMembers]         = useState<TripMember[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
  }, [])

  const fetchMembers = () => {
    fetch(`/api/trips/${tripId}/members`)
      .then(r => r.json())
      .then(data => { setMembers(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchMembers() }, [tripId])

  const isOwner = members.find(m => m.user_id === currentUserId)?.role === 'owner'
  const unreadCount = NOTIFICATIONS.filter(n => !n.read).length

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Collaboration</h1>
          <p className="text-muted-foreground text-sm">Manage team members and stay updated on trip activities</p>
        </div>
        {isOwner && <InviteMemberModal tripId={tripId} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="members" className="w-full">
            <TabsList className="grid w-full max-w-sm grid-cols-2">
              <TabsTrigger value="members">
                Team Members ({members.length})
              </TabsTrigger>
              <TabsTrigger value="notifications">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
            </TabsList>

            {/* Members tab */}
            <TabsContent value="members" className="mt-6 space-y-4">
              {/* Member cards */}
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
              ) : (
                <div className="space-y-3">
                  {members.map(m => {
                    const name    = m.profiles?.full_name ?? m.profiles?.email ?? 'Unknown'
                    const email   = m.profiles?.email ?? ''
                    const initial = (name[0] ?? '?').toUpperCase()
                    const isYou   = m.user_id === currentUserId
                    return (
                      <Card key={m.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {initial}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-sm">{name}</p>
                                  {isYou && <span className="text-xs text-muted-foreground">(you)</span>}
                                  <Badge variant={m.role === 'owner' ? 'default' : 'secondary'} className="text-xs capitalize">
                                    {m.role}
                                  </Badge>
                                </div>
                                {email && name !== email && (
                                  <p className="text-sm text-muted-foreground">{email}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-xs">Active</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

              {/* Stats footer row */}
              <div className="flex items-center gap-6 pt-4 border-t text-sm mt-2">
                <div>
                  <span className="font-semibold text-foreground">{members.length}</span>
                  <span className="text-muted-foreground ml-1.5">Total Members</span>
                </div>
                <div>
                  <span className="font-semibold text-green-600">{members.length}</span>
                  <span className="text-muted-foreground ml-1.5">Active</span>
                </div>
                <div>
                  <span className="font-semibold text-primary">
                    {members.filter(m => m.role === 'editor' || m.role === 'owner').length}
                  </span>
                  <span className="text-muted-foreground ml-1.5">Editors</span>
                </div>
              </div>

              {!isOwner && members.length > 0 && (
                <p className="text-xs text-muted-foreground px-1">
                  Only the trip owner can invite or remove members.
                </p>
              )}
            </TabsContent>

            {/* Notifications tab */}
            <TabsContent value="notifications" className="mt-6">
              <div className="space-y-3">
                {NOTIFICATIONS.map(n => (
                  <Card key={n.id} className={!n.read ? 'border-primary/40 bg-primary/5' : ''}>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className={`rounded-full p-2 h-10 w-10 flex items-center justify-center shrink-0 ${!n.read ? 'bg-primary' : 'bg-muted'}`}>
                          <Bell className={`h-4 w-4 ${!n.read ? 'text-white' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-sm">{n.title}</p>
                              <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                            </div>
                            {!n.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Activity feed sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-2">
                <ActivityFeed tripId={tripId} />
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
