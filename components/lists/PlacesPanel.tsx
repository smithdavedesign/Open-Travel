'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Trash2, MapPin, Star, UtensilsCrossed, Landmark, TreePine, ShoppingBag, Wifi, CheckCircle2, Clock, MoreVertical, Search, ChevronRight, Pencil, ThumbsUp, ThumbsDown, CalendarClock, Sun, Sunset, Moon, Layers, Link2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { PlaceWithVotes, PlaceCategory, PlaceStatus, TimeOfDay, PlaceDuration, MealType } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import PlaceSearchInput from '@/components/ui/PlaceSearchInput'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { parseGoogleMapsUrl, isMapsUrl, isShortMapsUrl } from '@/lib/maps/parseGoogleMapsUrl'

const CATEGORIES: { id: PlaceCategory; label: string; icon: React.ElementType; color: string; iconBg: string }[] = [
  { id: 'food_drink',    label: 'Food & Drink',   icon: UtensilsCrossed, color: 'text-orange-600', iconBg: 'bg-orange-100' },
  { id: 'things_to_do', label: 'Things To Do',    icon: Landmark,        color: 'text-pink-600',   iconBg: 'bg-pink-100' },
  { id: 'nature',        label: 'Nature',          icon: TreePine,        color: 'text-green-600',  iconBg: 'bg-green-100' },
  { id: 'shopping',      label: 'Shopping',        icon: ShoppingBag,     color: 'text-purple-600', iconBg: 'bg-purple-100' },
  { id: 'work_friendly', label: 'Work-Friendly',   icon: Wifi,            color: 'text-blue-600',   iconBg: 'bg-blue-100' },
]

interface Props {
  tripId: string
  initialPlaces: PlaceWithVotes[]
}

export default function PlacesPanel({ tripId, initialPlaces }: Props) {
  const searchParams = useSearchParams()

  const [places, setPlaces]           = useState<PlaceWithVotes[]>(initialPlaces)
  const [activeCategory, setActiveCategory] = useState<PlaceCategory>('food_drink')
  const [search, setSearch]           = useState('')
  const [dialogOpen, setDialogOpen]   = useState(false)
  const [editingPlace, setEditingPlace] = useState<PlaceWithVotes | null>(null)
  const [saving, setSaving]           = useState(false)
  const [form, setForm]               = useState({
    name: '', location: '', lng: null as number | null, lat: null as number | null,
    notes: '', url: '',
    reservation_needed: false,
    time_of_day: null as TimeOfDay | null,
    duration: null as PlaceDuration | null,
    meal_type: null as MealType | null,
  })

  // Active filters
  const [filterReservation, setFilterReservation] = useState<boolean | null>(null)
  const [filterTimeOfDay, setFilterTimeOfDay]     = useState<TimeOfDay | null>(null)
  const [filterDuration, setFilterDuration]       = useState<PlaceDuration | null>(null)
  const [filterMealType, setFilterMealType]       = useState<MealType | null>(null)

  // Maps URL import
  const [mapsUrl, setMapsUrl]       = useState('')
  const [mapsLoading, setMapsLoading] = useState(false)

  // Auto-import when arriving via PWA share target
  useEffect(() => {
    const importUrl = searchParams.get('import_url')
    if (importUrl) {
      setMapsUrl(importUrl)
      setDialogOpen(true)
      handleMapsUrl(importUrl)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

  const activeCfg = CATEGORIES.find(c => c.id === activeCategory)!
  const allCategoryPlaces = places.filter(p => p.category === activeCategory)
  const categoryPlaces = allCategoryPlaces.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.location?.toLowerCase().includes(search.toLowerCase())) return false
    if (filterReservation !== null && p.reservation_needed !== filterReservation) return false
    if (filterTimeOfDay && p.time_of_day !== filterTimeOfDay) return false
    if (filterDuration && p.duration !== filterDuration) return false
    if (filterMealType && p.meal_type !== filterMealType) return false
    return true
  })
  const approvedCount = allCategoryPlaces.filter(p => p.status === 'approved').length
  const hasActiveFilters = filterReservation !== null || filterTimeOfDay || filterDuration || filterMealType

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const emptyForm = { name: '', location: '', lng: null as number | null, lat: null as number | null, notes: '', url: '', reservation_needed: false, time_of_day: null as TimeOfDay | null, duration: null as PlaceDuration | null, meal_type: null as MealType | null }

  async function handleMapsUrl(raw: string) {
    if (!raw.trim() || !isMapsUrl(raw.trim())) return
    setMapsLoading(true)
    try {
      let resolved = raw.trim()
      if (isShortMapsUrl(resolved)) {
        const res = await fetch(`/api/resolve-url?url=${encodeURIComponent(resolved)}`)
        if (res.ok) resolved = (await res.json()).resolvedUrl ?? resolved
      }
      const parsed = parseGoogleMapsUrl(resolved)
      setForm(f => ({
        ...f,
        name:     parsed.name     ?? f.name,
        location: parsed.address  ?? f.location,
        lat:      parsed.lat      ?? f.lat,
        lng:      parsed.lng      ?? f.lng,
        url:      resolved,
      }))
      setMapsUrl('')
      if (parsed.name) toast.success(`Imported "${parsed.name}" from Maps`)
      else toast.info('Coordinates imported — add a name below')
    } catch {
      toast.error('Could not read that Maps link')
    } finally {
      setMapsLoading(false)
    }
  }

  function openAddDialog() {
    setEditingPlace(null)
    setForm(emptyForm)
    setMapsUrl('')
    setDialogOpen(true)
  }

  function openEditDialog(place: PlaceWithVotes) {
    setEditingPlace(place)
    setForm({
      name: place.name, location: place.location ?? '', lng: place.lng ?? null, lat: place.lat ?? null,
      notes: place.notes ?? '', url: place.url ?? '',
      reservation_needed: place.reservation_needed ?? false,
      time_of_day: place.time_of_day ?? null,
      duration: place.duration ?? null,
      meal_type: place.meal_type ?? null,
    })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingPlace(null)
    setForm(emptyForm)
  }

  async function savePlace() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editingPlace) {
        const updates = { name: form.name.trim(), location: form.location || null, lng: form.lng, lat: form.lat, notes: form.notes || null, url: form.url || null, reservation_needed: form.reservation_needed, time_of_day: form.time_of_day, duration: form.duration, meal_type: form.meal_type }
        const res = await fetch(`/api/trips/${tripId}/places/${editingPlace.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        if (!res.ok) throw new Error()
        const updated = await res.json()
        setPlaces(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
        toast.success(`"${updated.name}" updated`)
      } else {
        const res = await fetch(`/api/trips/${tripId}/places`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, name: form.name.trim(), category: activeCategory }),
        })
        if (!res.ok) throw new Error()
        const place = await res.json()
        setPlaces(prev => [...prev, { ...place, vote_count: 0, user_vote: null }])
        toast.success(`"${place.name}" added`)
      }
      closeDialog()
    } catch {
      toast.error(editingPlace ? 'Failed to update place' : 'Failed to add place')
    } finally {
      setSaving(false)
    }
  }

  async function castVote(place: PlaceWithVotes, dir: 1 | -1) {
    const isSameVote = place.user_vote === dir
    const newUserVote = isSameVote ? null : dir
    const voteDelta = isSameVote ? -dir : (place.user_vote !== null ? dir - place.user_vote : dir)

    // Optimistic update
    setPlaces(prev => prev.map(p =>
      p.id === place.id ? { ...p, user_vote: newUserVote, vote_count: p.vote_count + voteDelta } : p
    ))

    try {
      if (isSameVote) {
        await fetch(`/api/trips/${tripId}/places/${place.id}/vote`, { method: 'DELETE' })
      } else {
        await fetch(`/api/trips/${tripId}/places/${place.id}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vote: dir }),
        })
      }
    } catch {
      // Rollback on error
      setPlaces(prev => prev.map(p => p.id === place.id ? place : p))
      toast.error('Failed to save vote')
    }
  }

  async function toggleStatus(place: PlaceWithVotes) {
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
                onClick={() => { setActiveCategory(cat.id); setSearch(''); setFilterReservation(null); setFilterTimeOfDay(null); setFilterDuration(null); setFilterMealType(null) }}
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
            <Button size="sm" className="gap-1.5 h-8" onClick={openAddDialog}>
              <Plus className="h-3.5 w-3.5" />Add place
            </Button>
            <Dialog open={dialogOpen} onOpenChange={open => !open && closeDialog()}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingPlace ? 'Edit place' : 'Add a place to visit'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  {/* Google / Apple Maps URL import */}
                  {!editingPlace && (
                    <div className="rounded-lg border border-dashed bg-muted/30 px-3 py-2.5">
                      <p className="text-xs text-muted-foreground mb-1.5">Import from Google or Apple Maps</p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                          <input
                            type="url"
                            value={mapsUrl}
                            onChange={e => setMapsUrl(e.target.value)}
                            onPaste={e => {
                              const pasted = e.clipboardData.getData('text')
                              if (isMapsUrl(pasted)) {
                                e.preventDefault()
                                setMapsUrl(pasted)
                                handleMapsUrl(pasted)
                              }
                            }}
                            placeholder="Paste a Maps link…"
                            className="w-full pl-8 h-8 text-sm rounded-md border border-input bg-background px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 shrink-0"
                          disabled={mapsLoading || !mapsUrl.trim()}
                          onClick={() => handleMapsUrl(mapsUrl)}
                        >
                          {mapsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Import'}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label>Search or enter a place *</Label>
                    <PlaceSearchInput
                      mapboxToken={mapboxToken}
                      value={form.name}
                      onChange={v => setForm(f => ({ ...f, name: v, lng: null, lat: null }))}
                      onSelect={s => setForm(f => ({ ...f, name: s.name, location: s.address, lng: s.lng, lat: s.lat }))}
                      onClear={() => setForm(f => ({ ...f, name: '', location: '', lng: null, lat: null }))}
                      hasCoords={form.lng !== null}
                      placeholder="e.g. Ichiran Ramen, Shibuya"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="place-location">Address</Label>
                    <Input id="place-location" placeholder="Auto-filled from search, or type manually" value={form.location} onChange={set('location')} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="place-url">URL</Label>
                    <Input id="place-url" placeholder="https://…" value={form.url} onChange={set('url')} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="place-notes">Notes</Label>
                    <Input id="place-notes" placeholder="Any notes…" value={form.notes} onChange={set('notes')} />
                  </div>

                  {/* Time of day */}
                  <div className="space-y-1.5">
                    <Label>Best time of day</Label>
                    <div className="flex gap-2">
                      {(['morning', 'afternoon', 'evening'] as TimeOfDay[]).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, time_of_day: f.time_of_day === t ? null : t }))}
                          className={`flex-1 px-2 py-1.5 rounded-md border text-xs font-medium capitalize transition-colors ${form.time_of_day === t ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-border/80'}`}
                        >{t}</button>
                      ))}
                    </div>
                  </div>

                  {/* Meal type — food_drink only */}
                  {activeCategory === 'food_drink' && (
                    <div className="space-y-1.5">
                      <Label>Meal</Label>
                      <div className="flex gap-2">
                        {(['breakfast', 'lunch', 'dinner'] as MealType[]).map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, meal_type: f.meal_type === m ? null : m }))}
                            className={`flex-1 px-2 py-1.5 rounded-md border text-xs font-medium capitalize transition-colors ${form.meal_type === m ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-border/80'}`}
                          >{m}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Duration — non-food categories */}
                  {activeCategory !== 'food_drink' && (
                    <div className="space-y-1.5">
                      <Label>Duration</Label>
                      <div className="flex gap-2">
                        {([['full_day', 'Full day'], ['half_day', 'Half day']] as [PlaceDuration, string][]).map(([val, label]) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, duration: f.duration === val ? null : val }))}
                            className={`flex-1 px-2 py-1.5 rounded-md border text-xs font-medium transition-colors ${form.duration === val ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-border/80'}`}
                          >{label}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reservation needed */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.reservation_needed}
                      onChange={e => setForm(f => ({ ...f, reservation_needed: e.target.checked }))}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    <span className="text-sm">Reservation needed</span>
                  </label>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                    <Button onClick={savePlace} disabled={saving || !form.name.trim()}>
                      {saving ? 'Saving…' : editingPlace ? 'Save changes' : 'Add place'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {/* Reservation */}
          <button
            onClick={() => setFilterReservation(v => v === true ? null : true)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${filterReservation === true ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-foreground'}`}
          >
            <CalendarClock className="h-3 w-3" />Reservation required
          </button>

          {/* Time of day */}
          {([['morning', 'Morning', Sun], ['afternoon', 'Afternoon', Sunset], ['evening', 'Evening', Moon]] as [TimeOfDay, string, React.ElementType][]).map(([val, label, Icon]) => (
            <button
              key={val}
              onClick={() => setFilterTimeOfDay(v => v === val ? null : val)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${filterTimeOfDay === val ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-foreground'}`}
            >
              <Icon className="h-3 w-3" />{label}
            </button>
          ))}

          {/* Duration (non-food) */}
          {activeCategory !== 'food_drink' && ([['full_day', 'Full day'], ['half_day', 'Half day']] as [PlaceDuration, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterDuration(v => v === val ? null : val)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${filterDuration === val ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-foreground'}`}
            >
              <Layers className="h-3 w-3" />{label}
            </button>
          ))}

          {/* Meal type (food_drink) */}
          {activeCategory === 'food_drink' && ([['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner']] as [MealType, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterMealType(v => v === val ? null : val)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${filterMealType === val ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-foreground'}`}
            >
              {label}
            </button>
          ))}

          {/* Clear all */}
          {hasActiveFilters && (
            <button
              onClick={() => { setFilterReservation(null); setFilterTimeOfDay(null); setFilterDuration(null); setFilterMealType(null) }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Places grid */}
        {categoryPlaces.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-dashed">
            <activeCfg.icon className={`h-8 w-8 mx-auto mb-2 ${activeCfg.color} opacity-40`} />
            <p className="text-sm text-muted-foreground">
              {search || hasActiveFilters ? 'No places match your filters' : 'No places yet'}
            </p>
            {!search && !hasActiveFilters && (
              <button className="mt-2 text-sm text-primary hover:underline" onClick={openAddDialog}>
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
                        <DropdownMenuItem onClick={() => openEditDialog(place)}>
                          <Pencil className="h-3.5 w-3.5 mr-2" />Edit
                        </DropdownMenuItem>
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

                {/* Attribute badges */}
                {(place.time_of_day || place.duration || place.meal_type || place.reservation_needed) && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {place.time_of_day && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{place.time_of_day}</span>
                    )}
                    {place.meal_type && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{place.meal_type}</span>
                    )}
                    {place.duration && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{place.duration === 'full_day' ? 'Full day' : 'Half day'}</span>
                    )}
                    {place.reservation_needed && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Reservation</span>
                    )}
                  </div>
                )}

                {/* Group voting row */}
                <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-border/60">
                  <button
                    onClick={() => castVote(place, 1)}
                    title="Upvote"
                    className={`p-1 rounded transition-colors ${place.user_vote === 1 ? 'text-green-600' : 'text-muted-foreground/50 hover:text-green-500'}`}
                  >
                    <ThumbsUp className={`h-3.5 w-3.5 ${place.user_vote === 1 ? 'fill-green-600' : ''}`} />
                  </button>
                  <span className={`text-xs font-semibold tabular-nums min-w-[1.5ch] text-center ${
                    place.vote_count > 0 ? 'text-green-600' : place.vote_count < 0 ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {place.vote_count > 0 ? `+${place.vote_count}` : place.vote_count}
                  </span>
                  <button
                    onClick={() => castVote(place, -1)}
                    title="Downvote"
                    className={`p-1 rounded transition-colors ${place.user_vote === -1 ? 'text-destructive' : 'text-muted-foreground/50 hover:text-destructive'}`}
                  >
                    <ThumbsDown className={`h-3.5 w-3.5 ${place.user_vote === -1 ? 'fill-destructive' : ''}`} />
                  </button>
                  {place.vote_count >= 2 && (
                    <span className="ml-auto text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Popular</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
