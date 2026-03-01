'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Calendar, Map, ListTodo, FileText,
  DollarSign, Users, Plane, ChevronLeft, Settings,
} from 'lucide-react'

interface Props {
  tripId: string
  tripName: string
  userInitial: string
  userName: string
}

const NAV_ITEMS = (base: string) => [
  { href: `${base}/itinerary`,        label: 'Itinerary',      icon: Calendar },
  { href: `${base}/map`,              label: 'Map',            icon: Map },
  { href: `${base}/lists`,            label: 'Lists',          icon: ListTodo },
  { href: `${base}/documents`,        label: 'Documents',      icon: FileText },
  { href: `${base}/budget`,           label: 'Budget',         icon: DollarSign },
  { href: `${base}/collaboration`,    label: 'Collaboration',  icon: Users },
]

export default function TripSidebar({ tripId, tripName, userInitial, userName }: Props) {
  const pathname = usePathname()
  const base = `/trips/${tripId}`
  const navItems = NAV_ITEMS(base)

  function isActive(href: string) {
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-60 shrink-0 bg-card border-r flex flex-col h-screen sticky top-0 overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-4 border-b">
        <Link href="/trips" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="bg-primary rounded-lg p-2 shrink-0">
            <Plane className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground leading-tight">Open Fly</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Travel Assistant</p>
          </div>
        </Link>
      </div>

      {/* Trip context */}
      <div className="px-5 py-3 border-b">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">Current Trip</p>
        <p className="text-sm font-semibold text-foreground truncate">{tripName}</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t px-2 py-2 space-y-0.5">
        <Link
          href="/trips"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          All Trips
        </Link>
        <Link
          href={`/trips/${tripId}/settings`}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === `/trips/${tripId}/settings`
              ? 'bg-muted text-foreground font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </Link>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0 uppercase">
            {userInitial}
          </div>
          <p className="text-sm text-foreground truncate">{userName}</p>
        </div>
      </div>
    </aside>
  )
}
