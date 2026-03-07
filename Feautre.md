# Open Travel — Feature Roadmap

> **Sprint status**: Wandr P0 MVP complete. P1 in planning.

---

## ✅ P0 MVP — Complete (Wandr PRD)

All Wandr P0 features are implemented.

| Feature | Status | Notes |
|---------|--------|-------|
| Day-by-day itinerary (multi-view) | ✅ Done | List / Kanban / Block / Calendar views |
| Collaborative editing + real-time sync | ✅ Done | Supabase Realtime on events, expenses, documents, settlements, place_votes |
| Trip sharing & RBAC | ✅ Done | Owner / Editor / Viewer roles; RBAC on all API routes |
| Group expense splitting | ✅ Done | Equal / Exact / Percentage / Shares; settlement summary + balance view |
| Document storage + AI parsing | ✅ Done | Upload PDF/image → Claude → structured event |
| Flight status tracking | ✅ Done | AviationStack integration; FlightStatusModal per event |
| **Group voting on places** | ✅ Done | Thumbs up/down per member; net score; Popular badge; real-time sync; place_votes table |
| **Group Flight Board** | ✅ Done | `/trips/[tripId]/flights` — all members' flights by date; live status per row |
| **Reservations page** | ✅ Done | `/trips/[tripId]/reservations` — flights, hotels, car rentals in structured cards |
| **PWA offline mode** | ✅ Done | Serwist service worker; manifest; offline banner; static asset precaching |
| **Push notifications** | ✅ Done | VAPID/Web Push; subscribe/unsubscribe in Settings; SW push handler; /api/push/* routes |
| Places system with Mapbox autocomplete | ✅ Done | 5 categories; Search Box two-step; lng/lat stored; map pins |
| Budget tracker | ✅ Done | Per-category progress bars; inline target editing |
| Calendar view | ✅ Done | Month / Week / Day toggle; embedded in Itinerary as 4th view |
| Map view (Mapbox) | ✅ Done | Places as color-coded pins; SSR-safe |
| Weather integration | ✅ Done | Open-Meteo; daily forecast badges on itinerary + calendar |
| PDF export | ✅ Done | Full trip report — itinerary + expenses + balances |
| Trip duplication | ✅ Done | Shell copy (name/destinations/dates) |
| Public share link | ✅ Done | Owner-generated UUID token; read-only public view |
| Cover photo | ✅ Done | Upload via Settings; banner in trip layout |
| Activity feed | ✅ Done | Real-time log of all trip events |

---

## 🚧 P1 — Next Sprint (Wandr PRD)

Features required for the full Wandr P1 milestone.

| Feature | Priority | Notes |
|---------|---------|-------|
| AI Research Chatbot | High | In-app assistant for destination research, activity suggestions, local tips. Claude API + streaming. Sidebar widget or dedicated `/chat` route. |
| Ride-share integration | High | Uber/Lyft deep links from airport arrival events. Add "Get a ride" CTA to flight event cards. |
| Route optimization | Medium | Given a list of places, suggest optimal visit order. Google Maps Directions API or Mapbox Optimization API. |
| Smart packing list | Medium | AI-generated checklist seeded from trip destinations + dates (weather, activities). Claude prompt → pre-fill ChecklistPanel. |
| Push notification triggers | Medium | Wire up push send to: flight gate change (AviationStack poll), new expense split, place vote, trip invite. Currently infrastructure only. |
| VAPID key setup guide | Low | In-app instructions for setting `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` in `.env.local`. |
| Background Sync (offline mutations) | Low | Queue expense logs + checklist toggles + place votes in IndexedDB when offline; replay on reconnect via Serwist workbox-background-sync. |

---

## 🔮 P2 — Future (Wandr PRD + Strategic v3 PRD)

| Feature | Priority | Notes |
|---------|---------|-------|
| FX currency conversion | Medium | Open Exchange Rates API; show expense amounts in home currency; multi-currency budget view. |
| Group chat | Medium | Real-time trip chat channel per trip. Supabase Realtime broadcast or dedicated messages table. |
| Hotel deal notifications | Medium | Monitor price drops on saved hotels. Requires hotel search API (Amadeus or similar). |
| Email forwarding | Medium | Postmark inbound webhook; per-trip forwarding address; sender whitelist; auto-parse confirmations. |
| AI agentic booking ("Zero-touch travel") | High | Agent autonomously books flights/hotels within budget. Requires payment integration + booking APIs. Strategic v3 PRD flagship. |
| RecoverAI (disruption management) | High | Detect cancellations/delays → auto-rebook alternatives. Strategic v3 PRD. |
| eSIM provisioning | Low | Partner API (Airalo/Holafly) to purchase and install eSIM from within the app. |
| Ride-share booking (direct) | Low | Full booking (not just deep link) via Uber for Business API. |
| Discovery / recommendations engine | Low | Personalized place recommendations based on trip context. |
| Monetization / plan tiers | Later | Freemium gating: trip count, member limit, AI call quota. Stripe billing. |

---

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
| Phase 5 | Trip dashboard redesign | ✅ Done | Active / Planning / Past tabs + stats row; TripCard redesign with cover photo / gradient + status badge |
| Phase 6 | Event edit/delete | ✅ Done | PATCH + DELETE /api/events/[eventId]; AddEventModal controlled edit mode; optimistic delete in ItineraryClient |

---

## Figma UI Polish Pass — Completed

Design system overhaul and visual alignment with the Figma Make prototype. All hardcoded `slate-*` / `blue-*` colors replaced with semantic CSS tokens across all components.

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
| **DocumentList** | Card-based layout; Lucide file-type icons; StatusBadge; confidence progress bar; Eye/Trash2 icon buttons | ✅ Done |
| **Documents page** | Stats row (Total / Verified / Needs Review / Uploaded) shown when docs exist | ✅ Done |
| **ChecklistPanel** | Two-panel layout: category sidebar (solid primary active) + content panel with progress bar + inline add | ✅ Done |
| **PlacesPanel** | Two-panel layout: category sidebar (approved/total counts) + places grid with toggle status + vote buttons | ✅ Done |
| **Collaboration page** | Compact stats footer row (Total / Active / Editors) replacing big stat Cards | ✅ Done |

---

## Full Edit Capability — Completed

| Entity | Edit UI | API | Notes |
|--------|---------|-----|-------|
| **Trips** | Settings page — always-editable form (name, destinations, dates, status) | PATCH `/api/trips/[tripId]` | Owner-only Danger Zone with two-step delete confirmation |
| **Member roles** | MemberList — inline `<select>` dropdown per non-owner member | PATCH `/api/trips/[tripId]/members/[userId]` | Owner-only; cannot change own role |
| **Expenses** | AddExpenseModal — dual-mode via optional `expense?` prop; ExpenseList pencil icon | PATCH `/api/expenses/[expenseId]` | Deletes + rebuilds splits on save |
| **Checklist items** | ChecklistPanel — inline edit row (title, notes, qty) on pencil click | PATCH `/api/trips/[tripId]/checklists/[itemId]` | Optimistic update, rollback on fail |
| **Places** | PlacesPanel — reuses add dialog, pre-filled for edit; Mapbox Search Box autocomplete | PATCH `/api/trips/[tripId]/places/[placeId]` | Single dialog, dual-mode; `lng`/`lat` stored on place row |

---

## DB Migrations

| File | Description |
|------|-------------|
| `supabase/migrations/001_initial_schema.sql` | Core tables: profiles, trips, trip_members, events, expenses, expense_splits, settlements, documents, activity_feed |
| `supabase/migrations/002_lists.sql` | trip_checklist_items, trip_places tables |
| `supabase/migrations/003_place_coords.sql` | lng/lat columns on trip_places |
| `supabase/migrations/004_place_votes.sql` | place_votes table with RLS |
| `supabase/migrations/005_push_subscriptions.sql` | push_subscriptions table with RLS |
