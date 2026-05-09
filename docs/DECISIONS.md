# Car Wash Manager — Decision Log

> A running record of **why** we made key decisions.

---

## Decision Format

```
## [DATE] — [TITLE]
**Decision:** What we decided
**Reason:** Why
**Alternatives considered:** What we rejected and why
**Consequences:** What this means downstream
```

---

## [2026] — Use `@supabase/ssr` (not `auth-helpers-nextjs`)

**Decision:** Use `@supabase/ssr` for all Supabase client creation in Next.js App Router.

**Reason:** The legacy `@supabase/auth-helpers-nextjs` package failed in production on the Dataloop CRM — Vercel deployments could not forward the Supabase JWT correctly. `@supabase/ssr` is the current official solution.

**Alternatives considered:** `@supabase/auth-helpers-nextjs` — rejected due to documented production failure.

**Consequences:** All server-side calls use `createServerClient` from `@supabase/ssr`. Browser-side uses `createBrowserClient`. No mixing.

---

## [2026] — `next.config.mjs` in plain JavaScript (not TypeScript)

**Decision:** Config file is always `next.config.mjs` — plain JavaScript, no TypeScript.

**Reason:** Claude Code generated `next.config.ts` during the CRM build. Next.js did not support TypeScript config files, causing a build failure.

**Alternatives considered:** `next.config.ts` — rejected; caused build error.

**Consequences:** Never create `next.config.ts`. If Claude Code generates one, immediately rename it.

---

## [2026] — No third-party component library

**Decision:** Build all UI primitives from scratch in `/components/ui/`.

**Reason:** Reduces bundle size (critical for mobile), full control over touch targets, no dependency churn. Proven in CRM build.

**Alternatives considered:** shadcn/ui, Tailwind UI — both rejected.

**Consequences:** Claude Code builds all UI components.

---

## [2026] — Recharts wrapped in `dynamic()` with `ssr: false`

**Decision:** All Recharts components are lazy-loaded with `next/dynamic` and `ssr: false`.

**Reason:** Recharts uses browser APIs unavailable during SSR. Broke the CRM dashboard build.

**Consequences:** Every chart component file must have `"use client"` and be wrapped in `dynamic()`.

---

## [2026] — TypeScript strict mode + Matt Pocock conventions

**Decision:** `strict: true` in tsconfig. Inference over annotation, `satisfies` for configs, discriminated unions for state, `ts-reset`, Zod at boundaries.

**Consequences:** `any` is banned. Every function boundary explicitly typed. Zod schemas for all API request bodies.

---

## [2026] — Site isolation via `site_id`

**Decision:** Every table has a `site_id` column. RLS policies filter on `site_id` matched to the user's profile.

**Consequences:** Every query must filter by `site_id` (enforced via RLS). Claude Code must include `site_id` when inserting any row.

---

## [2026] — `app_config` JSONB table for configurable lists

**Decision:** Service types, vehicle types, price matrix, and payment methods live in `app_config` as JSONB.

**Consequences:** `app_config` values loaded via `config.ts` service. All dropdowns source from config, never from hardcoded arrays.

---

## [2026] — Daily Summary Revenue Model (not per-job logging)

**Decision:** Revenue is logged once per day as a structured summary, not job-by-job.

**Reason:** Target operators do not track individual cars in real time. The realistic workflow is: at end of day, owner or supervisor enters how many of each wash type they did, split by vehicle type. This is how they currently operate with pen and paper.

**Alternatives considered:** Per-job logging (as in original brief) — rejected. It requires staff to log each car individually, which adds friction and assumes a level of process discipline that doesn't exist at these businesses yet.

**Consequences:**
- `daily_revenue` table is the top-level day record
- `revenue_line_items` captures the service × vehicle type breakdown
- Cash and card totals entered as day-level fields (not per job)
- Dashboard aggregates from these tables rather than individual job records
- No "current queue" or real-time job tracking in v1

---

## [2026] — Service × Vehicle Type Price Matrix

**Decision:** Prices are set per combination of service type and vehicle type (e.g. "Full Wash + Van = R180").

**Reason:** In practice, a van costs more to wash than a car for the same service tier. Owners price by this matrix already, even if informally. Supporting it from the start prevents a painful migration later.

**Alternatives considered:**
- Price per service only (no vehicle distinction) — simpler but inaccurate
- Price per job (owner enters manually each time) — too much friction for a daily summary model

**Consequences:**
- `app_config` key `price_matrix` stores a flat object: `Record<"ServiceName|VehicleType", number>`
- Revenue entry form pre-fills unit prices from the matrix; owner can override per day
- Settings page has a price matrix editor (table of service types × vehicle types)

---

## [2026] — ZAR Currency Throughout

**Decision:** All monetary values are South African Rand (ZAR). Display format: `R1 234.50`.

**Reason:** Target market is South Africa. Using the wrong currency symbol would be a daily friction point.

**Alternatives considered:** Generic currency abstraction — unnecessary complexity for a v1 single-market product.

**Consequences:**
- `formatZAR(amount: number): string` utility in `src/lib/format.ts`
- Never use `£`, `$`, or `€` in the UI
- Space as thousands separator (South African convention: R1 234.50 not R1,234.50)

---

## [2026] — Open-Meteo for Weather (No API Key)

**Decision:** Use the Open-Meteo free weather API. No API key required.

**Reason:** It's free, has no rate limits for moderate use, covers South Africa well, and requires zero setup. Removing the need for another API key reduces onboarding friction.

**Alternatives considered:**
- OpenWeatherMap (paid/keyed) — adds cost and setup
- WeatherAPI.com (keyed) — adds complexity

**Consequences:**
- No `WEATHER_API_KEY` environment variable
- Weather fetch route: `GET /api/weather/daily?start=YYYY-MM-DD&end=YYYY-MM-DD`
- Results cached in `daily_weather` table to avoid re-fetching
- Site lat/lng stored in `sites` table; owner configures in Settings

---

## [2026] — Daily Rate × Days Worked = Weekly Wage

**Decision:** Wage calculation is: `daily_rate × days_present` for the week.

**Reason:** This is exactly how these businesses pay their staff. No hourly tracking, no overtime, no deductions in v1.

**Alternatives considered:**
- Hourly rate — requires clock in/out, too much infrastructure
- Fixed weekly salary — doesn't handle days off correctly
- Commission — too complex, not the model used

**Consequences:**
- `staff` table has `daily_rate NUMERIC(8,2)` column
- `attendance` table has one row per staff member per day, `present BOOLEAN`
- `calculateWeeklyWages()` in `src/lib/wages.ts` is a pure function over these two tables
- Weekly wage page shows: name | daily rate | days worked | total wage | week total

---

## [2026] — Manual Attendance Marking (No Clock In/Out)

**Decision:** The owner manually marks who was present each day via a simple attendance page.

**Reason:** Introducing clock in/out would require staff to have app access, which is out of scope for v1 (staff don't have logins).

**Alternatives considered:**
- Staff clock in/out via the app — requires staff logins, more complex
- Automatically mark all staff present — wrong; doesn't handle absence

**Consequences:**
- `/wages/attendance` page shows a date picker and a checkbox per active staff member
- Owner visits this page daily or catches up weekly
- `UNIQUE(site_id, staff_id, date)` constraint prevents duplicates

---

## [2026] — Cost Categories: `cos` vs `capex`

**Decision:** Two cost categories only: `cos` (cost of sales / consumables) and `capex` (capital equipment).

**Reason:** These map directly to how an accountant would classify these expenses. Consumables hit gross profit; equipment is capitalised or expensed differently. Keeping it to two categories is simple enough for an untrained operator to understand.

**Alternatives considered:**
- More granular categories (labour, utilities, marketing) — too complex for v1
- Free-text categories — too inconsistent for reporting

**Consequences:**
- `costs.category` is constrained to `cos | capex`
- Analytics dashboard shows revenue − CoS costs = gross profit (CoS only; capex shown separately)
- Monthly cost summary shows both categories with totals

---

## [2026] — Two User Roles: Admin and Manager

**Decision:** Two roles: `admin` (owner, full access) and `manager` (supervisor, can log revenue and attendance but cannot change settings or manage users).

**Reason:** The typical setup is one owner and one admin/supervisor. The owner needs to lock down settings and financial configuration. The supervisor just needs to log the day's work.

**Alternatives considered:**
- Single role (owner only) — too restrictive; supervisor can't log when owner is off-site
- Full RBAC — far too complex for v1

**Consequences:**
- `profiles.role` is `admin | manager`
- Settings, staff management, and user management are admin-only
- Revenue logging and attendance marking are available to both roles
- Middleware checks role for admin-only routes
