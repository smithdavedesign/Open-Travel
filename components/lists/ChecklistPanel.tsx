'use client'

import { useState } from 'react'
import { Plus, Trash2, Luggage, ShoppingBag, Star, UtensilsCrossed, List, MoreVertical, Search, ChevronRight, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import type { ChecklistItem, ChecklistCategory } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'

const CATEGORIES: { id: ChecklistCategory; label: string; icon: React.ElementType; color: string; iconBg: string }[] = [
  { id: 'packing',     label: 'Packing List',  icon: Luggage,         color: 'text-blue-600',   iconBg: 'bg-blue-100' },
  { id: 'grocery',     label: 'Grocery List',  icon: ShoppingBag,     color: 'text-green-600',  iconBg: 'bg-green-100' },
  { id: 'souvenirs',   label: 'Souvenir List', icon: Star,            color: 'text-yellow-600', iconBg: 'bg-yellow-100' },
  { id: 'food_to_try', label: 'Food to Try',   icon: UtensilsCrossed, color: 'text-orange-600', iconBg: 'bg-orange-100' },
  { id: 'other',       label: 'Other',         icon: List,            color: 'text-slate-600',  iconBg: 'bg-slate-100' },
]

interface Props {
  tripId: string
  initialItems: ChecklistItem[]
}

export default function ChecklistPanel({ tripId, initialItems }: Props) {
  const [items, setItems]           = useState<ChecklistItem[]>(initialItems)
  const [activeCategory, setActiveCategory] = useState<ChecklistCategory>('packing')
  const [search, setSearch]         = useState('')
  const [newTitle, setNewTitle]     = useState('')
  const [adding, setAdding]         = useState(false)
  const [saving, setSaving]         = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editForm, setEditForm]     = useState({ title: '', notes: '', quantity: '' })

  const activeCfg = CATEGORIES.find(c => c.id === activeCategory)!
  const allCategoryItems = items.filter(i => i.category === activeCategory)
  const categoryItems    = search
    ? allCategoryItems.filter(i => i.title.toLowerCase().includes(search.toLowerCase()))
    : allCategoryItems
  const checkedCount = allCategoryItems.filter(i => i.checked).length

  async function addItem() {
    if (!newTitle.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/checklists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), category: activeCategory }),
      })
      if (!res.ok) throw new Error()
      const item: ChecklistItem = await res.json()
      setItems(prev => [...prev, item])
      setNewTitle('')
      setAdding(false)
      toast.success(`"${item.title}" added`)
    } catch {
      toast.error('Failed to add item')
    } finally {
      setSaving(false)
    }
  }

  async function toggleItem(item: ChecklistItem) {
    const next = !item.checked
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, checked: next } : i))
    try {
      await fetch(`/api/trips/${tripId}/checklists/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked: next }),
      })
      if (next) toast.success(`"${item.title}" checked off`)
    } catch {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, checked: item.checked } : i))
      toast.error('Failed to update item')
    }
  }

  function startEdit(item: ChecklistItem) {
    setEditingItemId(item.id)
    setEditForm({ title: item.title, notes: item.notes ?? '', quantity: item.quantity?.toString() ?? '' })
  }

  async function saveEdit(item: ChecklistItem) {
    if (!editForm.title.trim()) return
    const updates = {
      title: editForm.title.trim(),
      notes: editForm.notes || null,
      quantity: editForm.quantity ? parseInt(editForm.quantity) : null,
    }
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...updates } : i))
    setEditingItemId(null)
    try {
      await fetch(`/api/trips/${tripId}/checklists/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
    } catch {
      setItems(prev => prev.map(i => i.id === item.id ? item : i))
      toast.error('Failed to update item')
    }
  }

  async function deleteItem(itemId: string, title: string) {
    setItems(prev => prev.filter(i => i.id !== itemId))
    try {
      await fetch(`/api/trips/${tripId}/checklists/${itemId}`, { method: 'DELETE' })
      toast.success(`"${title}" removed`)
    } catch {
      toast.error('Failed to delete item')
    }
  }

  return (
    <div className="flex gap-6 min-h-[500px]">
      {/* Left: category sidebar */}
      <div className="w-64 shrink-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Categories</p>
        <div className="space-y-1">
          {CATEGORIES.map(cat => {
            const Icon    = cat.icon
            const count   = items.filter(i => i.category === cat.id).length
            const checked = items.filter(i => i.category === cat.id && i.checked).length
            const active  = activeCategory === cat.id
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
                      {checked}/{count} items
                    </p>
                  )}
                </div>
                <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-white/70' : 'text-muted-foreground'}`} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Right: list content */}
      <div className="flex-1 min-w-0">
        {/* Panel header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold text-foreground">{activeCfg.label}</h3>
            <p className="text-xs text-muted-foreground">{checkedCount} of {allCategoryItems.length} completed</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 w-36 text-sm" />
            </div>
            <Button size="sm" onClick={() => setAdding(true)} className="gap-1.5 h-8">
              <Plus className="h-3.5 w-3.5" />Add item
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {allCategoryItems.length > 0 && (
          <div className="mb-4 space-y-1">
            <Progress value={allCategoryItems.length ? (checkedCount / allCategoryItems.length) * 100 : 0} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {allCategoryItems.length ? Math.round((checkedCount / allCategoryItems.length) * 100) : 0}%
            </p>
          </div>
        )}

        {/* Inline add form */}
        {adding && (
          <div className="flex gap-2 mb-3">
            <Input
              autoFocus
              placeholder="Item title…"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addItem()
                if (e.key === 'Escape') { setAdding(false); setNewTitle('') }
              }}
              className="flex-1"
            />
            <Button onClick={addItem} disabled={saving || !newTitle.trim()} size="sm">{saving ? '…' : 'Add'}</Button>
            <Button variant="outline" size="sm" onClick={() => { setAdding(false); setNewTitle('') }}>Cancel</Button>
          </div>
        )}

        {/* Items */}
        {categoryItems.length === 0 && !adding ? (
          <div className="text-center py-12 rounded-xl border border-dashed">
            <activeCfg.icon className={`h-8 w-8 mx-auto mb-2 ${activeCfg.color} opacity-40`} />
            <p className="text-sm text-muted-foreground">
              {search ? `No items matching "${search}"` : 'No items yet'}
            </p>
            {!search && (
              <button className="mt-2 text-sm text-primary hover:underline" onClick={() => setAdding(true)}>
                Add your first item
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {categoryItems.map(item => (
              <div
                key={item.id}
                className={`group flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  item.checked ? 'bg-muted/50 border-border/50' : 'bg-card border-border hover:border-border'
                }`}
              >
                {editingItemId === item.id ? (
                  /* Inline edit form */
                  <div className="flex-1 flex items-center gap-2 flex-wrap">
                    <Input
                      autoFocus
                      value={editForm.title}
                      onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(item); if (e.key === 'Escape') setEditingItemId(null) }}
                      className="flex-1 h-7 text-sm"
                    />
                    <Input
                      placeholder="Notes…"
                      value={editForm.notes}
                      onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                      className="w-32 h-7 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={editForm.quantity}
                      onChange={e => setEditForm(f => ({ ...f, quantity: e.target.value }))}
                      className="w-16 h-7 text-sm"
                    />
                    <button onClick={() => saveEdit(item)} className="text-xs text-primary hover:underline font-medium">Save</button>
                    <button onClick={() => setEditingItemId(null)} className="text-xs text-muted-foreground hover:underline">Cancel</button>
                  </div>
                ) : (
                  <>
                    <Checkbox checked={item.checked} onCheckedChange={() => toggleItem(item)} className="shrink-0" />
                    <span className={`flex-1 text-sm ${item.checked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {item.title}
                      {item.quantity && item.quantity > 1 && (
                        <span className="ml-1 text-xs text-muted-foreground">×{item.quantity}</span>
                      )}
                    </span>
                    {item.notes && (
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">{item.notes}</span>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground transition-all">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(item)}>
                          <Pencil className="h-3.5 w-3.5 mr-2" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteItem(item.id, item.title)} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
