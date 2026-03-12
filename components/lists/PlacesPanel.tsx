'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, MapPin, ThumbsUp, ThumbsDown, Pencil, Trash2, Search, ExternalLink, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { PlaceCategory, PlaceWithVotes, PlaceStatus } from '@/types'

const CATEGORIES: { key: PlaceCategory; label: string; icon: string }[] = [
  { key: 'food_drink', label: 'Food & Drink', icon: '🍽️' },
  { key: 'things_to_do', label: 'Things to Do', icon: '🎯' },
  { key: 'nature', label: 'Nature', icon: '🌿' },
  { key: 'shopping', label: 'Shopping', icon: '🛍️' },
  { key: 'work_friendly', label: 'Work Friendly', icon: '💻' },
]

const STATUS_STYLES: Record<PlaceStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
}

const EMPTY_FORM = {
  name: '',
  category: 'food_drink' as PlaceCategory,
  location: '',
  notes: '',
  url: '',
}

interface Props {
  tripId: string
  currentUserId: string
  role: 'owner' | 'editor' | 'viewer'
}

export default function PlacesPanel({ tripId, currentUserId, role }: Props) {
  const [places, setPlaces] = useState<PlaceWithVotes[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<PlaceCategory>('food_drink')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingPlace, setEditingPlace] = useState<PlaceWithVotes | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const canEdit = role === 'owner' || role === 'editor'

  const fetchPlaces = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/places`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPlaces(data)
    } catch {
      toast.error('Failed to load places')
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => { fetchPlaces() }, [fetchPlaces])

  const filtered = places.filter(p => p.category === activeCategory)

  const categoryCount = (cat: PlaceCategory) => {
    const items = places.filter(p => p.category === cat)
    const approved = items.filter(p => p.status === 'approved').length
    return { total: items.length, approved }
  }

  const resetAndCloseDialog = () => {
    setShowAddDialog(false)
    setEditingPlace(null)
    setForm({ ...EMPTY_FORM })
  }

  const openAddDialog = () => {
    setEditingPlace(null)
    setForm({ ...EMPTY_FORM, category: activeCategory })
    setShowAddDialog(true)
  }

  const openEditDialog = (place: PlaceWithVotes) => {
    setEditingPlace(place)
    setForm({
      name: place.name,
      category: place.category,
      location: place.location ?? '',
      notes: place.notes ?? '',
      url: place.url ?? '',
    })
    setShowAddDialog(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editingPlace) {
        // Update existing place
        const res = await fetch(`/api/trips/${tripId}/places/${editingPlace.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            category: form.category,
            location: form.location || null,
            notes: form.notes || null,
            url: form.url || null,
          }),
        })
        if (!res.ok) throw new Error('Failed to update place')
        const updated = await res.json()
        setPlaces(prev => prev.map(p => p.id === editingPlace.id ? { ...p, ...updated } : p))
        toast.success('Place updated')
      } else {
        // Create new place
        const res = await fetch(`/api/trips/${tripId}/places`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            category: form.category,
            location: form.location || null,
            notes: form.notes || null,
            url: form.url || null,
          }),
        })
        if (!res.ok) throw new Error('Failed to add place')
        const newPlace = await res.json()
        setPlaces(prev => [...prev, { ...newPlace, vote_count: 0, user_vote: null }])
        toast.success('Place added')
      }
      // FIX: Close the dialog and reset form after successful save
      resetAndCloseDialog()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save place')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (placeId: string) => {
    if (!confirm('Delete this place?')) return
    try {
      await fetch(`/api/trips/${tripId}/places/${placeId}`, { method: 'DELETE' })
      setPlaces(prev => prev.filter(p => p.id !== placeId))
      toast.success('Place deleted')
    } catch {
      toast.error('Failed to delete place')
    }
  }

  const handleVote = async (placeId: string, vote: 1 | -1) => {
    const place = places.find(p => p.id === placeId)
    if (!place) return

    // Toggle: if same vote, remove it; otherwise set new vote
    const newVote = place.user_vote === vote ? null : vote

    // Optimistic update
    setPlaces(prev => prev.map(p => {
      if (p.id !== placeId) return p
      let delta = 0
      if (p.user_vote === vote) delta = -vote  // removing same vote
      else if (p.user_vote === null) delta = newVote ?? 0
      else delta = (newVote ?? 0) - p.user_vote
      return { ...p, user_vote: newVote, vote_count: p.vote_count + delta }
    }))

    try {
      await fetch(`/api/trips/${tripId}/places/${placeId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: newVote }),
      })
    } catch {
      fetchPlaces() // rollback
    }
  }

  const handleToggleStatus = async (place: PlaceWithVotes) => {
    const newStatus: PlaceStatus = place.status === 'approved' ? 'pending' : 'approved'
    setPlaces(prev => prev.map(p => p.id === place.id ? { ...p, status: newStatus } : p))
    try {
      await fetch(`/api/trips/${tripId}/places/${place.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch {
      fetchPlaces()
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Loading places…</div>
  }

  return (
    <div className="flex gap-6">
      {/* Category sidebar */}
      <div className="w-52 shrink-0 space-y-1">
        {CATEGORIES.map(cat => {
          const { total, approved } = categoryCount(cat.key)
          const active = activeCategory === cat.key
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span>{cat.icon}</span>
              <span className="flex-1 text-left truncate">{cat.label}</span>
              <span className={`text-xs ${active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {approved}/{total}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content panel */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">
            {CATEGORIES.find(c => c.key === activeCategory)?.label}
          </h3>
          {canEdit && (
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-1" /> Add Place
            </Button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
            No places in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered
              .sort((a, b) => b.vote_count - a.vote_count)
              .map(place => (
                <div key={place.id} className="rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow group">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold truncate">{place.name}</h4>
                      {place.location && (
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {place.location}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => canEdit && handleToggleStatus(place)}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[place.status]} ${canEdit ? 'cursor-pointer hover:opacity-80' : ''}`}
                      >
                        {place.status}
                      </button>
                      {place.vote_count > 2 && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                          <Star className="h-3 w-3" /> Popular
                        </span>
                      )}
                    </div>
                  </div>

                  {place.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{place.notes}</p>
                  )}

                  <div className="flex items-center justify-between">
                    {/* Vote controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVote(place.id, 1)}
                        className={`p-1.5 rounded-md transition-colors ${
                          place.user_vote === 1
                            ? 'bg-green-100 text-green-600'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                      <span className={`text-sm font-semibold min-w-[1.5rem] text-center ${
                        place.vote_count > 0 ? 'text-green-600' : place.vote_count < 0 ? 'text-red-500' : 'text-muted-foreground'
                      }`}>
                        {place.vote_count}
                      </span>
                      <button
                        onClick={() => handleVote(place.id, -1)}
                        className={`p-1.5 rounded-md transition-colors ${
                          place.user_vote === -1
                            ? 'bg-red-100 text-red-500'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {place.url && (
                        <a
                          href={place.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {canEdit && (
                        <>
                          <button
                            onClick={() => openEditDialog(place)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(place.id)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        if (!open) resetAndCloseDialog()
        else setShowAddDialog(true)
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPlace ? 'Edit Place' : 'Add Place'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Central Park"
              />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as PlaceCategory }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CATEGORIES.map(c => (
                  <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="Address or area"
              />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Why visit this place?"
              />
            </div>
            <div className="space-y-1">
              <Label>URL</Label>
              <Input
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={resetAndCloseDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : editingPlace ? 'Update' : 'Add Place'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
