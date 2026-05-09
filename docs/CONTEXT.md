# Car Wash Manager — Current Context

> **This file is read by Claude Code at the start of every session.**
> Update it whenever the working focus changes. Keep it short and actionable.

---

## What We're Building

A web app for South African small car wash owners to manage daily operations: log daily revenue by service type and vehicle type, track costs (consumables and equipment), manage staff rosters and weekly wages, and view analytics with weather overlay.

**Stack:** Next.js 15 · Supabase · Vercel · Tailwind CSS v4 · TypeScript (strict)
**Currency:** South African Rand (ZAR). Format: `R1 234.50`. Use `formatZAR()` from `src/lib/format.ts`.
**Language:** English only.

---

## Current Focus

**Phase 0 — Discovery complete. Begin Phase 1.**

### Immediate Next Steps (Phase 1–2)

1. **Environment setup** (manual — not Claude Code)
   - Ensure Node.js v20 LTS installed
   - Ensure Git installed and configured
   - Install Claude Code: `npm install -g @anthropic-ai/claude-code`
   - Create new GitHub repository: `carwash-manager`

2. **Project scaffold** (first Claude Code prompt — see CLAUDE_CODE_PROMPTS.md)
   - Scaffold Next.js 15 with App Router, TypeScript strict, Tailwind v4
   - Install: `@supabase/supabase-js`, `@supabase/ssr`, `@anthropic-ai/sdk`, `zod`, `recharts`, `@total-typescript/ts-reset`
   - Set up `.env.local.example`
   - Create Supabase project, run initial migrations (schema from SPEC.md)
   - Generate Supabase types: `npx supabase gen types typescript`

3. **Auth** (second Claude Code prompt)
   - Login page at `/(auth)/login`
   - Password reset at `/(auth)/reset-password`
   - `middleware.ts` protecting all routes except `/(auth)/*`
   - Using `@supabase/ssr` — NOT `@supabase/auth-helpers-nextjs`

---

## Key Domain Concepts

| Concept | Description |
|---------|-------------|
| Daily Revenue Entry | One record per day. Line items = service type × vehicle type × quantity × unit price |
| Cash/Card Split | Total cash and total card captured at day level |
| Cost of Sales (CoS) | Consumable purchases: chemicals, cloths, wax |
| CapEx | Equipment purchases: pressure washers, tools |
| Attendance | Owner marks each staff member present/absent per day |
| Daily Rate | Fixed ZAR amount per day worked. Wage = rate × days present |
| Price Matrix | `app_config` JSONB: price per "ServiceType\|VehicleType" combination |
| Weather | Open-Meteo API (free, no key). Cached in `daily_weather` table |

---

## Key Files Claude Code Must Know About

| File | Purpose |
|------|---------|
| `SPEC.md` | DB schema, API routes, env vars, Open-Meteo integration |
| `ARCHITECTURE.md` | Folder structure, naming conventions, TypeScript patterns |
| `STYLE_GUIDE.md` | All UI component patterns and Tailwind conventions |
| `DECISIONS.md` | Why we made specific choices — don't contradict these |
| `CLAUDE_CODE_PROMPTS.md` | Ordered build prompts — use these |

---

## Active Gotchas (Read Before Every Prompt)

| ⚠️ Issue | What To Do |
|---------|------------|
| Config file | ALWAYS create `next.config.mjs` — NEVER `next.config.ts` |
| Supabase auth | Use `@supabase/ssr` — NEVER `@supabase/auth-helpers-nextjs` |
| Charts | Wrap Recharts in `dynamic()` with `ssr: false` |
| TypeScript | No `any` — use `unknown`. No redundant type annotations |
| Inputs | Always `text-base` (16px) on `<input>` and `<select>` |
| RLS | Write RLS policies before writing application queries |
| API keys | `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_KEY` are server-side ONLY |
| Currency | All money = ZAR. Use `formatZAR()`. Never use £ or $ |
| Weather | Open-Meteo — no API key needed. Site lat/lng in `sites` table |
| Revenue model | Daily summary (NOT per-job). See `daily_revenue` + `revenue_line_items` |

---

## Open Questions

- [ ] Will there be a need for real-time updates (live queue board)?
- [ ] Do we need offline support (PWA with service worker for poor signal)?
- [ ] Should the attendance page support bulk "mark all present" for a typical day?
- [ ] Should weekly wage export (CSV) be in v1 or v2?
