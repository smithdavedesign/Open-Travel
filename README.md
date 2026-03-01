# Open Fly Travel Assistant

A collaborative group travel app built with Next.js 15 and Supabase. Plan trips together, parse booking confirmations with AI, split expenses, and share itineraries.

---

## Features

- **Trip management** — create trips with destinations, dates, status, and cover photos
- **Itinerary** — 4 view modes: List, Kanban, Block, Calendar; add/edit/delete events
- **Document parsing** — upload PDFs or images; Claude AI extracts event details automatically
- **Budget tracker** — track expenses with 4 split modes (equal, exact, %, shares); balance summaries; settle up
- **Lists** — Checklists (packing/grocery/souvenirs/food/other) + Places to Visit (food/activities/nature/shopping/work)
- **Collaboration** — invite members with viewer/editor/owner roles; real-time sync; activity feed
- **Weather** — 14-day forecast from Open-Meteo shown on timeline day headings and calendar
- **Public share links** — read-only trip view for anyone, no sign-in required
- **PDF export** — full trip report with itinerary, expenses, and balances

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth — Google OAuth |
| Storage | Supabase Storage (`trip-documents` bucket) |
| Realtime | Supabase Realtime subscriptions |
| AI Parsing | Claude API (`claude-sonnet-4-6`) |
| Weather | Open-Meteo (free, no API key) |
| Deployment | Vercel |

---

## Architecture

MVC pattern enforced across all features:

```
models/          → Supabase queries only (adminSupabase service role)
controllers/     → business logic, orchestrates models
app/api/**/      → route handlers, call controllers
app/(app)/**/    → server page components
components/      → client UI components
```

### Per-Trip Layout

```
┌─────────────────────────────────────────────────────────┐
│  TripSidebar (240px)        │  Main column (flex-1)      │
│                             │                             │
│  Itinerary                  │  Trip header + cover photo  │
│  Map                        │                             │
│  Lists                      │  {page content}             │
│  Documents                  │  TripRealtimeSync           │
│  Budget                     │                             │
│  Collaboration              │                             │
│  Settings                   │                             │
└─────────────────────────────────────────────────────────┘
```

---

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd travel-bot
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

### 3. Supabase setup

1. Create a Supabase project
2. Run migrations in the SQL editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_lists.sql`
3. Create a Storage bucket named `trip-documents` (private)
4. Enable Google OAuth in Auth → Providers
5. Set redirect URL: `http://localhost:3000/api/auth/callback`
6. Enable Realtime:
   ```sql
   alter publication supabase_realtime add table events, expenses, documents, settlements, activity_feed;
   ```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database Tables

`profiles`, `trips`, `trip_members`, `events`, `expenses`, `expense_splits`, `settlements`, `documents`, `activity_feed`, `trip_checklist_items`, `trip_places`

All tables have RLS enabled. Role hierarchy: `viewer` < `editor` < `owner`.

---

## Key Routes

| Route | Description |
|-------|-------------|
| `/trips` | Dashboard — Active/Planning/Past tabs + stats |
| `/trips/[tripId]/itinerary` | Multi-view itinerary (List/Kanban/Block/Calendar) |
| `/trips/[tripId]/lists` | Checklists + Places to Visit |
| `/trips/[tripId]/documents` | Upload + AI-parsed booking confirmations |
| `/trips/[tripId]/budget` | Expenses, splits, balances |
| `/trips/[tripId]/collaboration` | Members + activity feed |
| `/trips/[tripId]/settings` | Cover photo, share link, duplicate |
| `/share/trips/[token]` | Public read-only view (no auth required) |

---

## Document Parsing Pipeline

1. Upload PDF or image → stored in Supabase Storage
2. Claude reads the file → returns structured event data + confidence score
3. `confidence >= 0.85` → review modal opens automatically
4. User confirms → event created, document linked
