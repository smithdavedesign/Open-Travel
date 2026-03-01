# Open Travel — Feature Roadmap

## Scaffolded but incomplete

| Thing | Status | Gap |
|-------|--------|-----|
| Split modes | ✅ Done | All 4 modes: equal, exact $, percentage %, shares — UI + controller + API complete |
| Settlement recording | ✅ Done | UI + API built |
| Role enforcement | ✅ Done | RBAC applied to all mutation routes |
| Cover photo | ✅ Done | Upload via Settings; banner shown in trip layout; editor+ can upload/remove |
| Activity feed | ✅ Done | Live feed on timeline page sidebar — logs events, expenses, documents, invites, settlements |
| Document viewer | ✅ Done | View button fetches signed URL; images preview in modal; PDFs/others open in new tab; delete also added |

---

## Figma Migration Phases — Completed

| Phase | Feature | Status | Notes |
|-------|---------|--------|-------|
| Phase 1 | Sidebar layout + navigation restructure | ✅ Done | TripSidebar replaces TripNav; flex h-screen layout; all trip routes accessible from sidebar |
| Phase 2 | Itinerary multi-view | ✅ Done | List / Kanban / Block / Calendar views in ItineraryClient; CalendarView extracted to shared component |
| Phase 3 | Lists system | ✅ Done | Checklists (5 categories) + Places to Visit (5 categories); 002_lists.sql migration; full MVC + API |
| Phase 4 | Collaboration page redesign | ✅ Done | /collaboration shows members + stats + ActivityFeed sidebar |
| Phase 5 | Trip dashboard redesign | ✅ Done | Active / Planning / Past tabs + stats row (Total / Active / Planning / Past counts); TripCard redesign with cover photo / gradient + status badge |
| Phase 6 | Event edit/delete | ✅ Done | PATCH + DELETE /api/events/[eventId]; AddEventModal controlled edit mode; optimistic delete in ItineraryClient |

---

## Figma UI Polish Pass — Completed

Design system overhaul and visual alignment with the Figma Make prototype. All hardcoded `slate-*` / `blue-*` colors replaced with semantic CSS tokens (`text-foreground`, `text-muted-foreground`, `bg-card`, `bg-muted`, `border`, `text-primary`, `text-primary-foreground`) across all components.

| Area | Change | Status |
|------|--------|--------|
| **Design tokens** | Global semantic color pass — no more hardcoded slate/blue across all components | ✅ Done |
| **TripSidebar** | Active nav item: solid `bg-primary text-primary-foreground` (was pale tint); semantic borders/backgrounds | ✅ Done |
| **TripCard** | Semantic colors; `from-primary/5 to-primary/15` gradient placeholder; Lucide Plane icon | ✅ Done |
| **EventCard** | Lucide icon circles replacing emoji (TYPE_CONFIG `icon: React.ElementType`); confirmed badge | ✅ Done |
| **KanbanView** | Compact single-line event rows (icon dot + title + time/location) replacing full tall EventCard | ✅ Done |
| **BlockView** | Fixed icon rendering bug (`<cfg.icon />` JSX vs text); lighter primary gradient header | ✅ Done |
| **Layout header** | Notification bell icon (links to /collaboration); semantic member avatar colors | ✅ Done |
| **Trips list page** | Lucide Plane empty state icon; semantic stat card colors | ✅ Done |
| **Budget page** | Real Lucide category icons (Plane, Hotel, UtensilsCrossed, Zap, Car) in CATEGORY_CONFIG | ✅ Done |
| **BalanceSummary** | Flat "X owes Y $amt" debt list with inline Settle button; member initials avatars | ✅ Done |
| **DocumentUpload** | Upload Lucide icon in `bg-primary/10` circle; semantic drag-over / idle border colors | ✅ Done |
| **DocumentList** | Card-based layout; Lucide file-type icons; StatusBadge (Verified/Needs Review/Uploaded); confidence progress bar; Eye/Trash2 icon buttons | ✅ Done |
| **Documents page** | Stats row (Total / Verified / Needs Review / Uploaded) shown when docs exist; centered `max-w-3xl` layout | ✅ Done |
| **ChecklistPanel** | Two-panel layout: category sidebar (solid primary active) + content panel with progress bar + inline add | ✅ Done |
| **PlacesPanel** | Two-panel layout: category sidebar (approved/total counts) + places grid with toggle status | ✅ Done |
| **Collaboration page** | Compact stats footer row (Total / Active / Editors) replacing big stat Cards | ✅ Done |

---

## Full Edit Capability — Completed

Users can now edit anything they can create. Follows the dual-mode modal/inline pattern established by `AddEventModal`.

| Entity | Edit UI | API | Notes |
|--------|---------|-----|-------|
| **Trips** | Settings page — always-editable form (name, destinations, dates, status) | PATCH `/api/trips/[tripId]` (existing) | Owner-only Danger Zone with two-step delete confirmation → redirects to `/trips` |
| **Member roles** | MemberList — inline `<select>` dropdown per non-owner member | PATCH `/api/trips/[tripId]/members/[userId]` (new) | Owner-only; cannot change own role |
| **Expenses** | AddExpenseModal — dual-mode via optional `expense?` prop; ExpenseList pencil icon | PATCH `/api/expenses/[expenseId]` (new) | Deletes + rebuilds splits on save; full split mode support |
| **Checklist items** | ChecklistPanel — inline edit row (title, notes, qty) on pencil click | PATCH `/api/trips/[tripId]/checklists/[itemId]` (existing) | Optimistic update, rollback on fail |
| **Places** | PlacesPanel — reuses add dialog, pre-filled for edit; pencil in dropdown | PATCH `/api/trips/[tripId]/places/[placeId]` (existing) | Single dialog, dual-mode via `editingPlace` state |

---

## Not started / In progress (PRD features)

| Feature | Priority | Status |
|---------|---------|--------|
| Calendar view | High | ✅ Done — Month/Week/Day toggle; time-block grid for Week+Day; month cell chips; click day → Day view; auto-navigates to trip start date; also embedded as 4th view in Itinerary |
| Email forwarding (PRD flagship) | High | Skipped for now — Postmark inbound webhook, sender whitelist, per-trip address |
| Real-time collaboration | High | ✅ Done — Supabase Realtime subscriptions on events/expenses/documents/settlements |
| Budget targets + progress bars | Medium | ✅ Done — total + per-category bars, inline set budget |
| Trip duplication/template | Medium | ✅ Done — duplicates shell (name/destinations/dates), no events copied |
| Public shareable trip link | Medium | ✅ Done — owner generates UUID token, /share/trips/[token] public read-only page |
| Flight status alerts (AviationStack) | Low | 🔀 In review — `copilot/add-flight-status-lookup`; Radar button on flight events (List/Kanban/Block views); `FlightStatusModal`; `GET /api/flight-status`; `lib/aviationstack/client.ts`; needs `AVIATIONSTACK_API_KEY` env var |
| FX conversion (Open Exchange Rates) | Low | Not started |
| Weather integration | Low | ✅ Done — Open-Meteo (free, no key); geocode + daily forecast; WeatherBadge on timeline day headings (server) and calendar month cells/week headers/day view (client) |
| Map view (Mapbox) | Low | 🔀 In review — `copilot/featuremap`; Mapbox GL JS, geocodes places, category filter pills, popups; needs `NEXT_PUBLIC_MAPBOX_TOKEN` env var |
| PDF itinerary/expense export | Low | ✅ Done — GET /api/trips/[tripId]/export streams full report: itinerary + expenses + balances |
| Notifications (in-app, email, push) | Low | Not started |
| Monetization / plan tiers | Later | Not started |
| Discovery/recommendations | Later | Not started |
