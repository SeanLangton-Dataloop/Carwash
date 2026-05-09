# Car Wash Manager — Claude Code Build Prompts

> Use these prompts in order. One prompt per Claude Code session.
> Commit after every working build before moving to the next prompt.
> Read CONTEXT.md at the start of every session.

---

## How to Use This File

1. Open VS Code terminal
2. Run `claude` to start Claude Code
3. Paste the prompt for the current phase
4. When it completes and the build passes: `git add . && git commit -m "..." && git push`
5. Move to the next prompt

---

## PROMPT 1 — Project Scaffold

```
Read CONTEXT.md, SPEC.md, ARCHITECTURE.md, and STYLE_GUIDE.md before doing anything.

Scaffold a new Next.js 15 project called carwash-manager with the following configuration:

Framework: Next.js 15 with App Router
Language: TypeScript with strict mode
Styling: Tailwind CSS v4
Package manager: npm

After scaffolding, install these additional packages:
- @supabase/supabase-js
- @supabase/ssr
- @anthropic-ai/sdk
- zod
- recharts
- @total-typescript/ts-reset

Create the following files:

1. next.config.mjs (plain JavaScript — NOT TypeScript):
   - No special config needed yet, just the basic export

2. tsconfig.json with:
   - strict: true
   - noUncheckedIndexedAccess: true
   - exactOptionalPropertyTypes: true

3. .env.local.example with these variables (no values):
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_KEY=
   ANTHROPIC_API_KEY=
   NEXT_PUBLIC_APP_URL=

4. src/lib/format.ts:
   - formatZAR(amount: number): string
   - Returns values like "R1 234.50" (space as thousands separator, period as decimal)

5. src/lib/weather.ts:
   - wmoCodeToLabel(code: number): string
   - Maps Open-Meteo WMO weather codes to human labels
   - Include codes: 0 (Clear sky), 1-3 (Mainly clear/Partly cloudy/Overcast), 45/48 (Fog), 51-57 (Drizzle), 61-67 (Rain), 80-82 (Rain showers), 95 (Thunderstorm)
   - Return "Unknown" for unmapped codes

6. src/lib/types.ts:
   - All shared TypeScript types matching the schema in SPEC.md
   - Include: Site, DailyRevenue, RevenueLineItem, Cost, Staff, Attendance, DailyWeather, AppConfig, Profile
   - Use discriminated union for user roles: type UserRole = 'admin' | 'manager'
   - Use discriminated union for cost categories: type CostCategory = 'cos' | 'capex'

7. src/app/globals.css with Tailwind v4 setup and CSS variables from STYLE_GUIDE.md

Verify the project builds with `npm run build` before finishing.
```

---

## PROMPT 2 — Supabase Schema & Types

```
Read CONTEXT.md and SPEC.md before doing anything.

Create the Supabase migration file at supabase/migrations/20260101000001_initial_schema.sql

The migration must create all tables defined in SPEC.md section 3:
- sites (with latitude, longitude, location_name columns)
- daily_revenue (with UNIQUE constraint on site_id + date)
- revenue_line_items
- costs (with category CHECK constraint: 'cos' or 'capex')
- staff (with daily_rate column in ZAR)
- attendance (with UNIQUE constraint on site_id + staff_id + date)
- daily_weather (with UNIQUE constraint on site_id + date)
- app_config (with composite primary key on site_id + key)
- profiles

Also create:
- set_updated_at trigger function and apply it to all tables with updated_at
- handle_new_user trigger that creates a profiles row on auth.users insert
- compute_line_total trigger on revenue_line_items that sets line_total = quantity * unit_price
- sync_daily_totals trigger on revenue_line_items that recomputes total_revenue and wash_count on daily_revenue

Enable RLS on all tables. Create site_isolation policies for each table using:
  (site_id = (SELECT site_id FROM profiles WHERE id = auth.uid()))

Create a second migration: supabase/migrations/20260101000002_seed_default_config.sql
This should insert default app_config rows for a new site:
- service_types: Basic Wash, Full Wash, Valet (all active: true)
- vehicle_types: Car, Van, SUV, Bakkie, Motorcycle (all active: true)
- price_matrix with sensible ZAR defaults:
  Basic Wash|Car: 80, Basic Wash|Van: 100, Basic Wash|SUV: 100, Basic Wash|Bakkie: 100, Basic Wash|Motorcycle: 60
  Full Wash|Car: 150, Full Wash|Van: 200, Full Wash|SUV: 200, Full Wash|Bakkie: 180, Full Wash|Motorcycle: 100
  Valet|Car: 350, Valet|Van: 500, Valet|SUV: 500, Valet|Bakkie: 450, Valet|Motorcycle: 200

After creating migrations, generate TypeScript types:
npx supabase gen types typescript --local > src/lib/database.types.ts

Update src/lib/supabase.ts to create a typed browser client using Database from database.types.ts
Create src/lib/supabase-server.ts to create a typed server client using @supabase/ssr (NOT auth-helpers)
```

---

## PROMPT 3 — App Shell & Navigation

```
Read CONTEXT.md, ARCHITECTURE.md, and STYLE_GUIDE.md before doing anything.

Create the app shell: root layout with mobile bottom nav and desktop sidebar.

1. src/app/layout.tsx — root layout
   - Wraps all pages
   - Renders <AppShell> around {children}
   - Sets up html/body with system font stack from STYLE_GUIDE.md

2. src/components/layout/AppShell.tsx — client component
   - On mobile (< md): shows bottom tab bar, fixed to screen bottom
   - On desktop (≥ md): shows left sidebar, 240px wide
   - Navigation items: Dashboard, Revenue, Costs, Wages, Staff, Settings

3. src/components/layout/BottomNav.tsx — mobile bottom nav
   - 5 tabs: Dashboard, Revenue, Costs, Wages, Menu
   - "Menu" opens a slide-up sheet with: Staff, Settings, Users
   - Active tab is highlighted with sky-500 colour
   - Minimum 44px touch target on each tab
   - Icons: use simple SVG icons (no external icon library)

4. src/components/layout/Sidebar.tsx — desktop sidebar
   - Logo/app name at top
   - Navigation links: Dashboard, Revenue, Costs, Wages, Staff, Settings, Users
   - Users link only visible when user role is 'admin'
   - Active link highlighted
   - User name and role shown at bottom

5. src/app/page.tsx — redirects to /dashboard

6. Placeholder pages (just heading + "coming soon" text, no functionality yet):
   - src/app/dashboard/page.tsx
   - src/app/revenue/page.tsx
   - src/app/costs/page.tsx
   - src/app/wages/page.tsx
   - src/app/staff/page.tsx
   - src/app/settings/page.tsx
   - src/app/users/page.tsx

Follow STYLE_GUIDE.md exactly for all colours, spacing, and component patterns.
Verify the build passes before finishing.
```

---

## PROMPT 4 — Authentication

```
Read CONTEXT.md, ARCHITECTURE.md, and STYLE_GUIDE.md before doing anything.

Implement authentication using @supabase/ssr — NOT @supabase/auth-helpers-nextjs.

1. middleware.ts in the project root:
   - Protects all routes except /(auth)/*
   - Checks Supabase session using @supabase/ssr
   - Redirects unauthenticated users to /login
   - Redirects authenticated users away from /login to /dashboard

2. src/app/(auth)/login/page.tsx:
   - Email + password form
   - Primary button: "Sign in"
   - Link to forgot password
   - Show inline error if credentials wrong
   - On success: redirect to /dashboard
   - Mobile-first layout, no sidebar/nav (auth route group has its own layout)
   - Follow STYLE_GUIDE.md form patterns exactly

3. src/app/(auth)/layout.tsx:
   - Centred card layout, no sidebar/nav
   - App name at top of card

4. src/app/(auth)/reset-password/page.tsx:
   - Email input
   - "Send reset link" button
   - Success state shows confirmation message
   - Error state shows inline error

5. Server action or API route for logout that clears the Supabase session cookie.

6. Add user context: create src/lib/auth.ts with:
   - getUser(): Promise<User | null> — server-side user fetch
   - getUserRole(): Promise<UserRole | null> — fetches role from profiles table

All Supabase auth calls must use @supabase/ssr createServerClient with the cookie store.
Verify the build passes and login flow works end-to-end before finishing.
```

---

## PROMPT 5 — Settings & Configuration

```
Read CONTEXT.md, SPEC.md, and STYLE_GUIDE.md before doing anything.

Build the Settings page at src/app/settings/page.tsx (admin role only).

The settings page has four sections:

1. SITE DETAILS
   - Business name (text input)
   - Location name (text input — e.g. "Fish Hoek, Cape Town")
   - Latitude (number input — for weather API)
   - Longitude (number input — for weather API)
   - Save button

2. SERVICE TYPES
   - List of current service types with: name | active toggle | reorder
   - "Add service type" button → inline input to add new one
   - Cannot delete (only deactivate) to preserve historical data integrity

3. VEHICLE TYPES
   - Same pattern as service types

4. PRICE MATRIX
   - Table: rows = service types, columns = vehicle types
   - Each cell = ZAR price input (text-base size)
   - Prices are editable inline
   - Save all prices button
   - Display prices formatted without "R" symbol in the input (just the number)
   - Show "R" prefix as a label before each input

All config reads and writes use the app_config table via server actions.
Create src/lib/config.ts with:
   - getConfig(siteId: string, key: string): Promise<unknown>
   - setConfig(siteId: string, key: string, value: unknown): Promise<void>
   - getPriceMatrix(siteId: string): Promise<Record<string, number>>
   - getServiceTypes(siteId: string): Promise<{name: string, active: boolean}[]>
   - getVehicleTypes(siteId: string): Promise<{name: string, active: boolean}[]>

Follow STYLE_GUIDE.md card and form patterns.
Verify the build passes before finishing.
```

---

## PROMPT 6 — Revenue Logging (Daily Entry Form)

```
Read CONTEXT.md, SPEC.md, and STYLE_GUIDE.md before doing anything.

Build the revenue logging flow. This is the most important screen in the app.

The model is: one structured entry per day, not per-car.

1. src/app/revenue/new/page.tsx — "Log Today's Revenue"
   Structure:
   a. Date selector (defaults to today, can be changed for catch-up entries)
   b. Revenue line items table:
      - Rows = active service types from config
      - Columns = active vehicle types from config
      - Each cell = quantity input (how many of this combo were washed)
      - Unit price shown below quantity (pre-filled from price matrix, editable)
      - Row total shown at right (auto-calculated: sum of quantity × unit_price for that service)
   c. Payment split section:
      - Total Cash received (ZAR input)
      - Total Card received (ZAR input)
      - These should sum to match the calculated total; show a warning if they don't match
   d. Notes (optional textarea)
   e. Submit button: "Save day's revenue"

   On submit:
   - Insert one daily_revenue row
   - Insert revenue_line_items for every cell where quantity > 0
   - Show success toast
   - Redirect to /revenue

   Validation:
   - Date must not already have an entry (check before submit; show error if duplicate)
   - At least one line item must have quantity > 0
   - Cash + card total should equal calculated total (warn but don't block)

2. src/components/revenue/RevenueEntryForm.tsx — client component with all the form logic
   - Use React state for the matrix (service × vehicle → {quantity, unitPrice})
   - Calculate totals in real time as user types
   - Display totals in ZAR using formatZAR()

3. src/app/revenue/page.tsx — Revenue history list
   - List of past daily_revenue entries: date | wash count | total | cash | card
   - Sorted by date descending
   - Each row links to /revenue/[date]
   - "Log today's revenue" button at top
   - Empty state if no entries yet

4. src/app/revenue/[date]/page.tsx — View/edit a specific day
   - Shows the same form pre-filled with existing data
   - Can be edited and re-saved (upsert)
   - Show the line items breakdown clearly

All monetary values displayed using formatZAR() from src/lib/format.ts.
Verify the build passes before finishing.
```

---

## PROMPT 7 — Cost Tracking

```
Read CONTEXT.md, SPEC.md, and STYLE_GUIDE.md before doing anything.

Build the cost tracking module.

1. src/app/costs/page.tsx — Cost list
   - Two tabs or toggle: "Cost of Sales" | "Equipment (CapEx)"
   - List of costs for the selected category: date | description | amount
   - Sorted by date descending
   - Monthly total shown at top of each section
   - "Log a purchase" button

2. src/app/costs/new/page.tsx — Log a purchase
   Fields:
   - Date (date picker, defaults to today)
   - Category: radio group — "Cleaning/Consumables (Cost of Sales)" or "Equipment (CapEx)"
   - Description (text input — required)
   - Amount in ZAR (number input with R prefix)
   - Notes (optional textarea)
   - Submit button: "Save purchase"

   On submit:
   - Insert one costs row
   - Show success toast
   - Redirect to /costs

3. Show a simple monthly summary at the top of /costs:
   - This month's CoS total
   - This month's CapEx total
   - Combined total

All monetary values displayed using formatZAR().
Follow STYLE_GUIDE.md form and card patterns exactly.
Verify the build passes before finishing.
```

---

## PROMPT 8 — Staff Management

```
Read CONTEXT.md, SPEC.md, and STYLE_GUIDE.md before doing anything.

Build the staff management module (admin role only).

1. src/app/staff/page.tsx — Staff roster
   - List of active staff: name | role | daily rate | phone
   - "Add staff member" button
   - Each row has an edit button
   - Inactive staff hidden by default; toggle to show

2. src/app/staff/new/page.tsx — Add staff member
   Fields:
   - Full name (required)
   - Role: select — Washer | Supervisor | Owner
   - Daily rate in ZAR (number input with R prefix)
   - Phone (optional, WhatsApp number)
   - Submit: "Add staff member"

3. src/app/staff/[id]/page.tsx — Edit staff member
   - Same form pre-filled
   - "Deactivate" button (sets is_active = false — does not delete)
   - Cannot delete to preserve wage history

All monetary values (daily rate) displayed using formatZAR().
Follow STYLE_GUIDE.md patterns.
Verify the build passes before finishing.
```

---

## PROMPT 9 — Attendance & Wage Calculation

```
Read CONTEXT.md, SPEC.md, and STYLE_GUIDE.md before doing anything.

Build the attendance marking and weekly wage calculation module.

1. src/lib/wages.ts — Pure calculation functions:
   type WageSummary = {
     staffId: string
     name: string
     dailyRate: number
     daysWorked: number
     totalWage: number
   }
   
   calculateWeeklyWages(
     staff: Staff[],
     attendance: Attendance[],
     weekStart: Date,
     weekEnd: Date
   ): WageSummary[]

2. src/app/wages/attendance/page.tsx — Mark daily attendance
   - Date picker at top (defaults to today)
   - List of all active staff members
   - Each staff member: name | daily rate | toggle (Present / Absent)
   - Toggle defaults to Absent; owner taps Present for each person who worked
   - "Save attendance" button
   - On save: upsert attendance rows for that date
   - Show existing attendance if already saved for selected date

3. src/app/wages/page.tsx — Weekly wage summary
   - Week selector (Mon–Sun; defaults to current week)
   - Table: Staff name | Daily rate | Days worked | Total wage
   - Footer row: total wage bill for the week
   - Shows all active staff (shows R0 for staff with no attendance that week)
   - "Mark attendance" link to /wages/attendance

All monetary values using formatZAR().
Follow STYLE_GUIDE.md card and table patterns.
Verify the build passes before finishing.
```

---

## PROMPT 10 — Weather API Integration

```
Read CONTEXT.md, SPEC.md section 2.3, and SPEC.md section 8 before doing anything.

Build the Open-Meteo weather integration.

1. src/app/api/weather/daily/route.ts
   - GET handler accepting query params: start (YYYY-MM-DD), end (YYYY-MM-DD)
   - Requires authenticated session
   - Gets site lat/lng from the user's sites record
   - Checks daily_weather table for already-cached dates; only fetches missing dates
   - Calls Open-Meteo: https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&daily=weathercode,temperature_2m_max&timezone=Africa%2FJohannesburg&start_date={start}&end_date={end}
   - Maps WMO codes using wmoCodeToLabel() from src/lib/weather.ts
   - Upserts results into daily_weather table
   - Returns all weather data for the requested range
   - No API key needed — Open-Meteo is free and public

2. src/lib/weather.ts — ensure wmoCodeToLabel covers all common codes (see SPEC.md)

3. Create a useWeather(start: string, end: string) hook in src/lib/hooks/useWeather.ts
   - Fetches from /api/weather/daily
   - Returns { weather: DailyWeather[], isLoading: boolean, error: string | null }

The weather data will be used in the dashboard charts (next prompt).
No UI needed in this prompt — just the API route and hook.
Verify the build passes before finishing.
```

---

## PROMPT 11 — Analytics Dashboard

```
Read CONTEXT.md, SPEC.md, STYLE_GUIDE.md section 8 before doing anything.

Build the analytics dashboard at src/app/dashboard/page.tsx.

This is the first screen the owner sees after login. It must answer:
"How is my business doing?"

Layout (mobile-first, single column; 2-col grid on desktop):

SECTION 1 — Stat cards (4 cards in a 2×2 grid on mobile, 4-col on desktop)
- Today's revenue (ZAR)
- This week's revenue (ZAR)
- This month's revenue (ZAR)
- This month's wash count

SECTION 2 — Revenue chart (last 30 days)
- Bar chart: one bar per day = total revenue
- Overlay: weather condition shown as a coloured dot above each bar
  - Clear / mainly clear = yellow dot (☀)
  - Overcast / cloudy = grey dot
  - Rain / drizzle = blue dot (🌧)
  - Thunderstorm = dark blue dot
- Weather condition and max temp shown in tooltip on hover/tap
- X-axis: date labels (abbreviated)
- Y-axis: ZAR values using formatZAR()

SECTION 3 — Revenue breakdown (this month)
- Horizontal bar chart: revenue by service type
- Pie or donut chart: cash vs card split

SECTION 4 — Cost vs Revenue (this month)
- Grouped bar or stacked bar: revenue vs CoS costs per week
- Simple gross profit callout: "Gross profit this month: R12 450"

All charts must:
- Use Recharts
- Be wrapped in dynamic() with ssr: false (prevents SSR error)
- Have "use client" directive
- Use formatZAR() for all monetary axis/tooltip values
- Follow colour mapping from STYLE_GUIDE.md section 8
- Show a loading skeleton while data loads (STYLE_GUIDE.md section 5)
- Show an empty state if no data exists

Create chart components in src/components/dashboard/:
- RevenueBarChart.tsx
- ServiceBreakdownChart.tsx
- PaymentSplitChart.tsx
- CostRevenueChart.tsx

Create data fetch functions in src/lib/dashboard.ts:
- getDashboardStats(siteId: string): returns the 4 stat card values
- getRevenueByDay(siteId: string, days: number): returns daily revenue + weather for chart
- getRevenueByServiceType(siteId: string, month: string): returns breakdown
- getCostVsRevenue(siteId: string, month: string): returns weekly cost/revenue

Verify the build passes before finishing.
```

---

## PROMPT 12 — User Management

```
Read CONTEXT.md, SPEC.md, and STYLE_GUIDE.md before doing anything.

Build user management at src/app/users/page.tsx (admin role only).

1. List current users for the site: name | email | role | joined date
2. "Invite user" button — opens a form:
   - Email address
   - Role: Manager (supervisor) — can't invite another Admin
   - "Send invite" button calls /api/admin/invite-user
3. Each user row has a "Remove" button that calls /api/admin/remove-user
   - Confirm before removing
   - Cannot remove yourself

4. src/app/api/admin/invite-user/route.ts
   - POST handler
   - Validates caller is admin
   - Uses Supabase admin client (SUPABASE_SERVICE_KEY) to invite user by email
   - Sets role to 'manager' in profiles after invite

5. src/app/api/admin/remove-user/route.ts
   - POST handler
   - Validates caller is admin
   - Removes user from auth.users using admin client

Follow STYLE_GUIDE.md patterns.
Verify the build passes before finishing.
```

---

## PROMPT 13 — AI Daily Summary (Stub)

```
Read CONTEXT.md and SPEC.md before doing anything.

Create a stub for the AI daily summary feature. This will be implemented properly in v2,
but the route and UI hook should exist now.

1. src/app/api/ai/daily-summary/route.ts
   - POST handler requiring authenticated session
   - Request body: { date: string }
   - For now: return a static placeholder response:
     { summary: "AI daily summary will be available in a future update." }
   - Include TODO comment with the full implementation plan:
     - Fetch daily_revenue + line items for the date
     - Fetch daily_weather for the date
     - Fetch attendance for the date
     - Call Anthropic API with a prompt summarising the day
     - Return the generated narrative

2. Add a small "AI Summary" card to the dashboard (src/app/dashboard/page.tsx)
   that shows the placeholder text with a "coming soon" badge.

This prompt is intentionally small. The goal is to have the infrastructure in place.
Verify the build passes before finishing.
```

---

## PROMPT 14 — Polish & Mobile Testing

```
Read CONTEXT.md and STYLE_GUIDE.md before doing anything.

Polish pass — fix mobile UX and consistency issues.

1. Audit every page for:
   - Touch targets smaller than 44px — fix any found
   - Input or select elements without text-base class — fix any found
   - Missing focus:ring-2 focus:ring-sky-500 on interactive elements — fix any found
   - Any monetary value not going through formatZAR() — fix any found
   - Any hardcoded colour hex not in globals.css CSS variables — fix any found

2. Add loading skeletons to any page that fetches data but doesn't have one yet
   (use the animate-pulse pattern from STYLE_GUIDE.md)

3. Add empty states to any list page that doesn't have one yet
   (use the empty state pattern from STYLE_GUIDE.md)

4. Ensure the bottom nav on mobile shows the correct active state for all routes

5. Ensure all forms show inline errors when submission fails
   (use the error banner pattern from STYLE_GUIDE.md)

6. Test the revenue entry form with:
   - 3 service types × 5 vehicle types = 15 cells
   - Ensure the table scrolls horizontally on narrow mobile screens
   - Ensure number inputs on mobile don't cause iOS zoom (text-base enforced)

7. Add a simple favicon (can be text-based SVG — just "CW" initials in sky-500)

Verify the build passes before finishing.
```

---

## PROMPT 15 — Production Deployment

```
Read CONTEXT.md before doing anything.

Prepare the project for production deployment on Vercel + Supabase.

1. Verify next.config.mjs is plain JavaScript (NOT TypeScript)

2. Create vercel.json if needed for any routing configuration

3. Ensure all environment variables are documented in .env.local.example:
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_KEY=
   ANTHROPIC_API_KEY=
   NEXT_PUBLIC_APP_URL=

4. Add a README.md to the project root with:
   - Project description (1 paragraph)
   - Environment variables table
   - Local development setup steps
   - Supabase migration instructions: npx supabase db push
   - Deployment instructions (push to main → Vercel auto-deploys)

5. Run the production build: npm run build
   Fix any TypeScript errors or build warnings before finishing.

6. Verify there are no console.error calls that expose internal error details
   (all errors should be caught and show generic messages to the user)

Final checklist before marking as done:
- [ ] npm run build passes with no errors
- [ ] No TypeScript errors (npm run type-check)
- [ ] .env.local.example is complete
- [ ] README.md exists
- [ ] next.config.mjs is plain JS
- [ ] No hardcoded API keys anywhere in the codebase
```
