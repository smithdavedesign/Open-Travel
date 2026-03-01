'use client'

import { useState } from 'react'
import { Plus, Trash2, MapPin, Star, UtensilsCrossed, Landmark, TreePine, ShoppingBag, Wifi, CheckCircle2, Clock, MoreVertical, Search, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import type { Place, PlaceCategory, PlaceStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const CATEGORIES: { id: PlaceCategory; label: string; icon: React.ElementType; color: string; iconBg: string }[] = [
  { id: 'food_drink',    label: 'Food & Drink',   icon: UtensilsCrossed, color: 'text-orange-600', iconBg: 'bg-orange-100' },
  { id: 'things_to_do', label: 'Things To Do',    icon: Landmark,        color: 'text-pink-600',   iconBg: 'bg-pink-100' },
  { id: 'nature',        label: 'Nature',          icon: TreePine,        color: 'text-green-600',  iconBg: 'bg-green-100' },
  { id: 'shopping',      label: 'Shopping',        icon: ShoppingBag,     color: 'text-purple-600', iconBg: 'bg-purple-100' },
  { id: 'work_friendly', label: 'Work-Friendly',   icon: Wifi,            color: 'text-blue-600',   iconBg: 'bg-blue-100' },
]

interface Props {
  tripId: string
  initialPlaces: Place[]
}

export default function PlacesPanel({ tripId, initialPlaces }: Props) {
  const [places, setPlaces]           = useState<Place[]>(initialPlaces)
  const [activeCategory, setActiveCategory] = useState<PlaceCategory>('food_drink')
  const [search, setSearch]           = useState('')
  const [dialogOpen, setDialogOpen]   = useState(false)
  const [saving, setSaving]           = useState(false)
  const [form, setForm]               = useState({ name: '', location: '', notes: '', url: '' })

  const activeCfg = CATEGORIES.find(c => c.id === activeCategory)!
  const allCategoryPlaces = places.filter(p => p.category === activeCategory)
  const categoryPlaces    = search
    ? allCategoryPlaces.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.location?.toLowerCase().includes(search.toLowerCase()))
    : allCategoryPlaces
  const approvedCount = allCategoryPlaces.filter(p => p.status === 'approved').length

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  async function addPlace() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/places`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, name: form.name.trim(), category: activeCategory }),
      })
      if (!res.ok) throw new Error()
      const place: Place = await res.json()
      setPlaces(prev => [...prev, place])
      setForm({ name: '', location: '', notes: '', url: '' })
      setDialogOpen(false)
      toast.success(`"${place.name}" added`)
    } catch {
      toast.error('Failed to add place')
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(place: Place) {
    const next: PlaceStatus = place.status === 'pending' ? 'approved' : 'pending'
    setPlaces(prev => prev.map(p => p.id === place.id ? { ...p, status: next } : p))
    try {
      await fetch(`/api/trips/${tripId}/places/${place.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      toast.success(next === 'approved' ? `"${place.name}" approved` : `"${place.name}" marked pending`)
    } catch {
      setPlaces(prev => prev.map(p => p.id === place.id ? { ...p, status: place.status } : p))
      toast.error('Failed to update place')
    }
  }

  async function deletePlace(placeId: string, name: string) {
    setPlaces(prev => prev.filter(p => p.id !== placeId))
    try {
      await fetch(`/api/trips/${tripId}/places/${placeId}`, { method: 'DELETE' })
      toast.success(`"${name}" removed`)
    } catch {
      toast.error('Failed to delete place')
    }
  }

  return (
    <div className="flex gap-6 min-h-[500px]">
      {/* Left: category sidebar */}
      <div className="w-64 shrink-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Categories</p>
        <div className="space-y-1">
          {CATEGORIES.map(cat => {
            const Icon     = cat.icon
            const count    = places.filter(p => p.category === cat.id).length
            const approved = places.filter(p => p.category === cat.id && p.status === 'approved').length
            const active   = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setSearch('') }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors text-left ${
                  active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
                }`}
              >
                <div className={`rounded-lg p-1.5 shrink-0 ${active ? 'bg-white/20' : cat.iconBg}`}>
                  <Icon className={`h-4 w-4 ${active ? 'text-white' : cat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate leading-tight">{cat.label}</p>
                  {count > 0 && (
                    <p className={`text-xs leading-tight ${active ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {approved} approved · {count} total
                    </p>
                  )}
                </div>
                <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-white/70' : 'text-muted-foreground'}`} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Right: places content */}
      <div className="flex-1 min-w-0">
        {/* Panel header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold text-foreground">{activeCfg.label}</h3>
            <p className="text-xs text-muted-foreground">{approvedCount} approved</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 w-36 text-sm" />
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 h-8">
                  <Plus className="h-3.5 w-3.5" />Add place
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Add a place to visit</DialogTitle></DialogHeader>
                <div className="space-y-3 mt-2">
                  <div className="space-y-1">
                    <Label htmlFor="place-name">Name *</Label>
                    <Input id="place-name" placeholder="e.g. Ichiran Ramen" value={form.name} onChange={set('name')} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="place-location">Location / Area</Label>
                    <Input id="place-location" placeholder="e.g. Shibuya, Tokyo" value={form.location} onChange={set('location')} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="place-url">URL</Label>
                    <Input id="place-url" placeholder="https://…" value={form.url} onChange={set('url')} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="place-notes">Notes</Label>
                    <Input id="place-notes" placeholder="Any notes…" value={form.notes} onChange={set('notes')} />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={addPlace} disabled={saving || !form.name.trim()}>{saving ? 'Adding…' : 'Add place'}</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Places grid */}
        {categoryPlaces.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-dashed">
            <activeCfg.icon className={`h-8 w-8 mx-auto mb-2 ${activeCfg.color} opacity-40`} />
            <p className="text-sm text-muted-foreground">
              {search ? `No places matching "${search}"` : 'No places yet'}
            </p>
            {!search && (
              <button className="mt-2 text-sm text-primary hover:underline" onClick={() => setDialogOpen(true)}>
                Add your first place
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {categoryPlaces.map(place => (
              <div
                key={place.id}
                className={`group relative bg-card rounded-xl border p-4 transition-shadow hover:shadow-md ${
                  place.status === 'approved' ? 'border-green-200' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-sm text-foreground leading-snug">{place.name}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleStatus(place)} title={place.status === 'approved' ? 'Mark as pending' : 'Approve'}>
                      {place.status === 'approved' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground/40 hover:text-green-400 transition-colors" />
                      )}
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-foreground transition-all">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => deletePlace(place.id, place.name)} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {place.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{place.location}</span>
                  </div>
                )}

                {place.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{place.notes}</p>
                )}

                {place.rating && (
                  <div className="flex items-center gap-0.5 mt-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < place.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/20'}`} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
