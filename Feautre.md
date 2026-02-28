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

## Not started / In progress (PRD features)

| Feature | Priority | Status |
|---------|---------|--------|
| Calendar view | High | ✅ Done — Month/Week/Day toggle; time-block grid for Week+Day; month cell chips; click day → Day view; auto-navigates to trip start date |



| Feature | Priority | Status |
|---------|---------|--------|
| Email forwarding (PRD flagship) | High | Skipped for now — Postmark inbound webhook, sender whitelist, per-trip address |
| Real-time collaboration | High | ✅ Done — Supabase Realtime subscriptions on events/expenses/documents/settlements |
| Budget targets + progress bars | Medium | ✅ Done — total + per-category bars, inline set budget |
| Trip duplication/template | Medium | ✅ Done — duplicates shell (name/destinations/dates), no events copied |
| Public shareable trip link | Medium | ✅ Done — owner generates UUID token, /share/trips/[token] public read-only page |
| Flight status alerts (AviationStack) | Low | Not started |
| FX conversion (Open Exchange Rates) | Low | Not started |
| Weather integration | Low | ✅ Done — Open-Meteo (free, no key); geocode + daily forecast; WeatherBadge on timeline day headings (server) and calendar month cells/week headers/day view (client) |
| Map view (Mapbox) | Low | Not started |
| PDF itinerary/expense export | Low | ✅ Done — GET /api/trips/[tripId]/export streams full report: itinerary + expenses + balances |
| Notifications (in-app, email, push) | Low | Not started |
| Monetization / plan tiers | Later | Not started |
| Discovery/recommendations | Later | Not started |
