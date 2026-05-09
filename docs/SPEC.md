# Car Wash Manager — Technical Specification

> **Version:** 0.2 (Scope Confirmed)
> **Stack:** Next.js 15 · Supabase (PostgreSQL) · Vercel · Anthropic Claude API · Open-Meteo

---

## 1. Technology Stack

### 1.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15 (App Router) | React framework — routing, SSR, API routes |
| React | 19 | UI component library |
| TypeScript | 5 (strict) | Type-safe JavaScript |
| Tailwind CSS | 4 | Utility-first styling |
| Recharts | Latest | Analytics charts, weather overlay |

### 1.2 Backend & Database

| Technology | Version | Purpose |
|------------|---------|---------|
| Supabase | Cloud | PostgreSQL, Auth, Storage |
| PostgreSQL | 16 | Relational database |
| Next.js API Routes | 15 | Server-side logic, weather fetching, AI |
| @supabase/ssr | Latest | Correct session handling in App Router |
| Row Level Security | Built-in | Database-level access control |

### 1.3 External APIs & Integrations

| Technology | Plan | Purpose |
|------------|------|---------|
| Open-Meteo | Free (no key) | Daily weather data per site location |
| Anthropic Claude API | claude-sonnet-4-5 | AI daily summary (v2 feature, route stubbed in v1) |
| Vercel | Hobby | Hosting, CDN, auto-deploy |

### 1.4 Development Tools

| Tool | Purpose |
|------|---------|
| Claude Code | Primary build agent |
| VS Code | Local editor |
| Node.js | v20 LTS |
| npm | Package manager |
| Git + GitHub | Version control + Vercel CI/CD |

---

## 2. System Architecture

### 2.1 Overview

```
Browser → Vercel (Next.js) → Supabase (PostgreSQL + Auth)
                         ↘ Open-Meteo API (server-side, no key)
                         ↘ Anthropic API (server-side, key only)
```

### 2.2 Layer Breakdown

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| Presentation | React / Next.js / Tailwind | All UI, mobile-first, ZAR currency |
| Routing | Next.js App Router | File-based routing, middleware, protected routes |
| API | Next.js API Routes | Weather fetching, AI calls, admin operations |
| Auth | Supabase Auth + @supabase/ssr | JWT sessions, login, invite, password reset |
| Database | Supabase / PostgreSQL | All data, RLS policies, triggers |
| Weather | Open-Meteo (free, no key) | Daily weather fetch per site lat/lng |
| AI | Anthropic Claude API | Daily summary (v2) |
| Hosting | Vercel | Production, CDN, env vars |

### 2.3 Weather Data Strategy

- Open-Meteo provides free historical and current weather data with no API key
- Fetch is done server-side in a Next.js API route: `/api/weather/daily`
- Parameters fetched per day: `weathercode` (WMO code → human label), `temperature_2m_max`
- Site lat/lng stored in `sites` table; passed to Open-Meteo at fetch time
- Weather data cached in `daily_weather` table to avoid repeated API calls
- WMO weather codes mapped to human labels in `src/lib/weather.ts`
- Open-Meteo endpoint: `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&daily=weathercode,temperature_2m_max&timezone=Africa/Johannesburg`

### 2.4 Currency

All monetary values are in **South African Rand (ZAR)**. Display format: `R1 234.50` (space as thousands separator, period as decimal). Never use `£` or `$`. A `formatZAR(amount: number): string` utility lives in `src/lib/format.ts`.

---

## 3. Database Schema

### 3.1 `sites`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| name | TEXT | Business name e.g. "Yusuf's Hand Car Wash" |
| owner_id | UUID (FK) | References `auth.users.id` |
| timezone | TEXT | `Africa/Johannesburg` default |
| location_name | TEXT | Human-readable town e.g. "Fish Hoek, Cape Town" |
| latitude | NUMERIC(9,6) | For Open-Meteo weather API |
| longitude | NUMERIC(9,6) | For Open-Meteo weather API |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto (trigger) |

### 3.2 `daily_revenue`

One row per day. Captures the structured end-of-day revenue summary.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| site_id | UUID (FK) | References `sites.id` |
| date | DATE | The day this entry covers (unique per site) |
| total_revenue | NUMERIC(10,2) | Computed total (ZAR) — denormalised for query speed |
| cash_total | NUMERIC(10,2) | Total cash received (ZAR) |
| card_total | NUMERIC(10,2) | Total card received (ZAR) |
| wash_count | INTEGER | Total number of vehicles washed |
| notes | TEXT | Optional daily note |
| created_by | UUID (FK) | References `auth.users.id` |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto (trigger) |

**Constraint:** `UNIQUE(site_id, date)` — one entry per site per day.

### 3.3 `revenue_line_items`

Breakdown rows belonging to a `daily_revenue` entry. One row per service × vehicle type combination washed that day.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| daily_revenue_id | UUID (FK) | References `daily_revenue.id` |
| site_id | UUID (FK) | References `sites.id` (for RLS) |
| service_type | TEXT | e.g. "Basic Wash" — from config |
| vehicle_type | TEXT | e.g. "Car" — from config |
| quantity | INTEGER | Number of this combination washed |
| unit_price | NUMERIC(8,2) | Price charged per wash (ZAR) — snapshotted from config |
| line_total | NUMERIC(10,2) | quantity × unit_price (computed on insert) |

### 3.4 `costs`

One row per purchase / expense recorded.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| site_id | UUID (FK) | References `sites.id` |
| date | DATE | Date of purchase |
| amount | NUMERIC(10,2) | Amount paid (ZAR) |
| category | TEXT | `cos` (cost of sales) or `capex` (equipment) |
| description | TEXT | What was bought — required |
| notes | TEXT | Optional additional notes |
| created_by | UUID (FK) | References `auth.users.id` |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto (trigger) |

**`category` values:**
- `cos` — Cleaning chemicals, wax, microfibre cloths, consumables
- `capex` — Pressure washers, hoses, tools, equipment, signage

### 3.5 `staff`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| site_id | UUID (FK) | References `sites.id` |
| full_name | TEXT | Display name |
| daily_rate | NUMERIC(8,2) | Daily wage in ZAR |
| role | TEXT | `owner`, `supervisor`, `washer` |
| is_active | BOOLEAN | False = archived, not shown in dropdowns |
| phone | TEXT | WhatsApp/mobile — nullable |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto (trigger) |

### 3.6 `attendance`

One row per staff member per day. Owner marks attendance manually.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| site_id | UUID (FK) | References `sites.id` |
| staff_id | UUID (FK) | References `staff.id` |
| date | DATE | The work day |
| present | BOOLEAN | True = worked, False = absent |
| created_by | UUID (FK) | References `auth.users.id` |
| created_at | TIMESTAMPTZ | Auto |

**Constraint:** `UNIQUE(site_id, staff_id, date)`

### 3.7 `daily_weather`

Cache of fetched weather data per site per day. Prevents repeated Open-Meteo calls.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| site_id | UUID (FK) | References `sites.id` |
| date | DATE | The day |
| weather_code | INTEGER | WMO weather code (0=clear, 61=rain, etc.) |
| weather_label | TEXT | Human label e.g. "Clear sky", "Rain" |
| temp_max_c | NUMERIC(4,1) | Max temperature in Celsius |
| fetched_at | TIMESTAMPTZ | When this row was fetched |

**Constraint:** `UNIQUE(site_id, date)`

### 3.8 `app_config`

Flexible key/value config per site.

| Column | Type | Description |
|--------|------|-------------|
| key | TEXT | Config key |
| value | JSONB | JSON value |
| site_id | UUID (FK) | Per-site config |
| updated_at | TIMESTAMPTZ | Auto |

**Primary key:** `(site_id, key)`

**Config keys:**

| Key | Value shape | Example |
|-----|-------------|---------|
| `service_types` | `{name, active}[]` | `[{name:"Basic Wash",active:true}]` |
| `vehicle_types` | `{name, active}[]` | `[{name:"Car",active:true},{name:"Van",active:true}]` |
| `price_matrix` | `Record<"service|vehicle", number>` | `{"Basic Wash|Car":80,"Full Wash|Car":150}` |
| `payment_methods` | `string[]` | `["Cash","Card"]` — fixed in v1 |

**Default service types:** Basic Wash, Full Wash, Valet
**Default vehicle types:** Car, Van, SUV, Bakkie, Motorcycle

### 3.9 `profiles`

Auto-created on Supabase user signup.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | References `auth.users.id` |
| full_name | TEXT | Display name |
| email | TEXT | Email address |
| role | TEXT | `admin` (owner) or `manager` (supervisor) |
| site_id | UUID (FK) | The site this user belongs to |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto |

### 3.10 Database Triggers

| Trigger | Fires On | Action |
|---------|----------|--------|
| `set_updated_at` | UPDATE on all tables | Sets `updated_at = now()` |
| `handle_new_user` | AFTER INSERT on `auth.users` | Auto-creates `profiles` row |
| `compute_line_total` | INSERT/UPDATE on `revenue_line_items` | Sets `line_total = quantity × unit_price` |
| `sync_daily_totals` | INSERT/UPDATE/DELETE on `revenue_line_items` | Recomputes `daily_revenue.total_revenue` and `wash_count` |

### 3.11 Row Level Security

All tables have RLS enabled. Policies filter on `site_id` matched to the user's profile.

```sql
CREATE POLICY "site_isolation" ON daily_revenue
  USING (site_id = (SELECT site_id FROM profiles WHERE id = auth.uid()));
```

Same pattern for all tables. Admin role can manage staff and config; manager role can log revenue and attendance.

---

## 4. API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/weather/daily` | GET | Fetch and cache weather for a date range from Open-Meteo |
| `/api/revenue/summary` | GET | Aggregated revenue data for dashboard |
| `/api/wages/weekly` | GET | Weekly wage calculation for all active staff |
| `/api/ai/daily-summary` | POST | AI narrative summary (stub in v1, implement in v2) |
| `/api/admin/invite-user` | POST | Send Supabase invite email |
| `/api/admin/remove-user` | POST | Remove user from site |

---

## 5. Page Structure

| Route | Page | Who can access |
|-------|------|----------------|
| `/(auth)/login` | Login | Public |
| `/(auth)/reset-password` | Password reset | Public |
| `/dashboard` | Analytics overview | Admin + Manager |
| `/revenue` | Daily revenue list | Admin + Manager |
| `/revenue/new` | Log today's revenue | Admin + Manager |
| `/revenue/[date]` | View/edit a day's entry | Admin + Manager |
| `/costs` | Cost list + monthly total | Admin + Manager |
| `/costs/new` | Log a purchase | Admin + Manager |
| `/wages` | Weekly wage summary | Admin |
| `/wages/attendance` | Mark daily attendance | Admin + Manager |
| `/staff` | Staff roster | Admin |
| `/staff/new` | Add staff member | Admin |
| `/settings` | Site config, prices | Admin |
| `/users` | User management | Admin |

---

## 6. Environment Variables

| Variable | Source | Notes |
|----------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | Public |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API | **Secret** — server only |
| `ANTHROPIC_API_KEY` | console.anthropic.com | **Secret** — server only |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL | Auth redirects |

No key needed for Open-Meteo — it is a free public API.

---

## 7. Key Utility Functions

All live in `src/lib/`:

```ts
// format.ts
export function formatZAR(amount: number): string
// Returns "R1 234.50" — space thousands separator, period decimal

// weather.ts
export function wmoCodeToLabel(code: number): string
// Maps WMO weather codes to human labels

// wages.ts
export function calculateWeeklyWages(
  staff: Staff[],
  attendance: Attendance[]
): WageSummary[]
// Returns { staffId, name, daysWorked, dailyRate, totalWage }[]
```

---

## 8. Open-Meteo Integration

Base URL: `https://api.open-meteo.com/v1/forecast`

Parameters used:

```
latitude={lat}
longitude={lng}
daily=weathercode,temperature_2m_max
timezone=Africa%2FJohannesburg
start_date=YYYY-MM-DD
end_date=YYYY-MM-DD
```

WMO code to label mapping (subset):

| Code | Label |
|------|-------|
| 0 | Clear sky |
| 1–3 | Mainly clear / Partly cloudy / Overcast |
| 45, 48 | Foggy |
| 51–57 | Drizzle |
| 61–67 | Rain |
| 80–82 | Rain showers |
| 95 | Thunderstorm |

Full mapping lives in `src/lib/weather.ts`.

---

## 9. Infrastructure Costs (Single Site, ZAR)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | Free |
| Supabase | Free | Free (500MB) |
| Open-Meteo | Free | Free (no key) |
| Anthropic Claude API | Pay-per-use | ~R0.02–0.05 per AI call |
| GitHub | Free | Free |
| **Total v1** | | **R0–10/month** |

---

## 10. Known Issues from CRM Reference Build

| Issue | Prevention |
|-------|-----------|
| `next.config.ts` TypeScript errors | Always `next.config.mjs` plain JS |
| Vercel data not loading (JWT not forwarded) | Use `@supabase/ssr` from day one |
| `recharts` SSR error | Wrap charts in `dynamic()` with `ssr: false` |
| RLS blocking anon requests | Plan RLS policies before writing any code |
| AI routes returning 401 | Design auth-first; stub AI routes until auth works |
