# Car Wash Manager — Progress Tracker

> **Last updated:** Scope confirmed — ready to build
> Update this file at the start and end of every session.

---

## Current Phase: Ready to Build

**Discovery complete. All documents updated. Begin Phase 1.**

---

## Build Phases

| # | Phase | Status | Notes |
|---|-------|--------|-------|
| 0 | Discovery & Architecture | ✅ Done | Documents finalised v0.2 |
| 1 | Environment Setup | ⬜ Not started | Node.js, Git, Claude Code, GitHub repo |
| 2 | Project Scaffold | ⬜ Not started | Next.js 15, Tailwind v4, Supabase schema |
| 3 | App Shell | ⬜ Not started | Layout, bottom nav (mobile), sidebar (desktop) |
| 4 | Authentication | ⬜ Not started | Login, middleware, protected routes |
| 5 | Settings & Config | ⬜ Not started | Service types, vehicle types, price matrix |
| 6 | Revenue Logging | ⬜ Not started | Daily entry form with line items + cash/card split |
| 7 | Revenue List & Detail | ⬜ Not started | History list, edit existing day |
| 8 | Cost Tracking | ⬜ Not started | Log purchase, list, monthly totals |
| 9 | Staff Management | ⬜ Not started | Roster, add/edit staff, daily rates |
| 10 | Attendance & Wages | ⬜ Not started | Mark attendance, weekly wage summary |
| 11 | Analytics Dashboard | ⬜ Not started | Revenue charts, cost overlay, breakdown |
| 12 | Weather Integration | ⬜ Not started | Open-Meteo fetch, cache, overlay on charts |
| 13 | AI Daily Summary | ⬜ Not started | Stub route in v1, implement in v2 |
| 14 | User Management | ⬜ Not started | Invite, roles, remove |
| 15 | Polish & Testing | ⬜ Not started | Mobile testing, error states, ZAR formatting |
| 16 | Deployment | ⬜ Not started | Vercel + Supabase production config |

**Status key:** ✅ Done · 🟡 In progress · 🔴 Blocked · ⬜ Not started

---

## Completed

- [x] Discovery & scoping Q&A
- [x] BRIEF.md v0.2 — South Africa context, daily summary revenue model, cost categories, wage model
- [x] SPEC.md v0.2 — Full DB schema, Open-Meteo integration, ZAR currency, all page routes
- [x] PROGRESS.md v0.2 — Build phases updated
- [x] DECISIONS.md v0.2 — New decisions recorded
- [x] CONTEXT.md v0.2 — Updated focus and gotchas
- [x] CLAUDE_CODE_PROMPTS.md — Full build prompt sequence ready

---

## In Progress

*(Nothing — ready to begin Phase 1)*

---

## Blocked

*(Nothing blocked)*

---

## Backlog (post-v1)

- AI daily narrative summary (Claude API — route stubbed in v1)
- Customer records and wash history
- Shift open/close management
- Weekly wage export (CSV)
- Multi-month trend analysis
- SMS/WhatsApp customer nudges
- Inventory / stock level tracking
- Multi-site support

---

## Key Decisions Made This Phase

- Daily summary revenue model (not per-job) — owner enters structured totals at end of day
- Service × vehicle type price matrix — configurable per combination
- Cash + card split captured per day as totals
- Cost categories: `cos` (consumables) vs `capex` (equipment)
- Wage model: daily rate × days worked per week
- Attendance: owner marks manually per day (no clock in/out)
- Weather: Open-Meteo (free, no API key), configurable lat/lng per site
- Currency: ZAR (R), space as thousands separator
- Single site focus for v1
- Two user roles: admin (owner) + manager (supervisor)
