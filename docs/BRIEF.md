# Car Wash Manager — Project Brief

> **Version:** 0.2 (Scope Confirmed)
> **Stack:** Next.js 15 · Supabase · Vercel · Claude AI
> **Built with:** Claude Code

---

## 1. Problem Statement

Small car wash businesses in South Africa — typically owner-operated or employing 2–10 staff — run their operations almost entirely from memory, paper, or WhatsApp. There is no dedicated, affordable tool designed for the realities of their day-to-day: unpredictable footfall driven heavily by weather, a roughly 50/50 cash and card payment mix, staff scheduling and manual wage calculation, ad-hoc purchases of cleaning products and equipment, and no visibility on business performance over time.

The result is lost revenue (no visibility on peak times or weather correlation), poor cost control (no tracking of consumables or equipment spend), and owner burnout (manual wage calculations, no delegation tools).

---

## 2. Target Users

| User | Role | Primary Need |
|------|------|-------------|
| **Car wash owner** | Primary user | Business overview, revenue, costs, wages, decisions |
| **Shift supervisor / admin** | Daily operator | Log daily revenue, mark attendance, record purchases |

**Persona: "Yusuf"** — owns a single-site hand car wash in Fish Hoek, Cape Town. Works 6 days a week. Employs 4–6 staff on fixed daily rates. Takes roughly 50% cash, 50% card. Uses WhatsApp for staff communication. Has never tracked which days are busiest or how rain affects revenue. Has no system for reconciling wages at end of week.

---

## 3. Core Value Proposition

A simple, mobile-first web app that gives a small car wash owner in South Africa full operational visibility — revenue, costs, wages, and weather-correlated performance — without enterprise pricing, complex setup, or training requirements.

**Currency:** South African Rand (ZAR, R). English only.
**Free to very cheap.** Infrastructure target under R200/month (≈£8) for a single-site operator.

---

## 4. Feature Scope (v1)

Features are prioritised using MoSCoW. The v1 build covers **Must Have** only.

### Must Have

#### 4.1 Revenue Logging (Daily Summary Model)
- Owner or supervisor enters daily revenue as a structured summary at end of day
- Entry captures: for each service type × vehicle type combination, number of washes and total revenue
- Payment split also recorded per day: total cash received vs total card received
- Service types and vehicle types are fully configurable in Settings
- Price matrix is configurable: each service × vehicle type combination has a default price
- Historical daily entries are viewable and editable (corrections)

#### 4.2 Cost Tracking
- Record purchases as: date · amount (ZAR) · category · optional note
- Categories split into two types:
  - **Cost of Sales** (consumables): cleaning chemicals, wax, microfibre cloths, disposables
  - **Capital / Equipment**: pressure washers, hoses, tools, signage
- Simple list view and monthly totals
- No supplier management or stock levels in v1

#### 4.3 Staff & Wage Management
- Staff roster: name, daily rate (ZAR), role, active/inactive
- Attendance: owner manually marks each staff member present or absent per day
- Wage calculation: daily rate × days present = weekly wage per staff member
- Weekly wage summary view: who worked how many days, total wage bill
- No payslip generation in v1; view/export only

#### 4.4 Analytics Dashboard
- Daily, weekly, and monthly revenue charts
- Revenue breakdown by service type and by vehicle type
- Cash vs card split over time
- Cost of Sales overlay on revenue (gross profit view)
- Weather overlay: daily weather conditions (condition label + max temp) fetched automatically from Open-Meteo for the site's configured location, overlaid on revenue chart
- Busiest days of week analysis

#### 4.5 Settings & Configuration
- Service types: name, configurable (add/rename/deactivate)
- Vehicle types: name, configurable
- Price matrix: price per service × vehicle type combination
- Payment methods: Cash, Card (fixed in v1)
- Site details: business name, location (town name + lat/lng for weather API)
- Weather location: configurable — owner sets their town

#### 4.6 Authentication
- Owner and supervisor login via email + password
- Password reset
- Two roles: `admin` (owner) and `manager` (supervisor)

### Should Have (v2)
- AI daily narrative summary (end-of-day insight from Claude)
- Customer records and wash history
- Shift open/close management
- Weekly wage export (CSV)
- Multi-month trend analysis

### Could Have (v3+)
- SMS/WhatsApp nudges to returning customers
- Inventory stock level tracking with low-stock alerts
- Multi-site support

### Won't Have (v1)
- Online booking or pre-payment
- Payroll or tax calculations
- Accounting software integration (Xero, Sage)
- Native mobile app
- Customer-facing features

---

## 5. Success Metrics

| Metric | Target |
|--------|--------|
| Time to log a full day's revenue entry | < 3 minutes |
| Time for owner to see today's revenue | < 10 seconds from login |
| Time to mark daily attendance for 6 staff | < 60 seconds |
| Setup time (new owner, no tech background) | < 30 minutes |
| Monthly infra cost for single site | < R200 (≈£8) |
| Works on a mobile browser without issues | Yes — primary device |

---

## 6. Technology Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Framework | Next.js 15 (App Router) | Proven from Dataloop CRM |
| Database + Auth | Supabase | Free tier covers v1 |
| Hosting | Vercel | Auto-deploy from GitHub |
| Styling | Tailwind CSS v4 | Utility-first, mobile-first |
| Language | TypeScript (strict) | Type safety |
| AI features | Anthropic Claude API (claude-sonnet-4-5) | Server-side only |
| Weather | Open-Meteo API | Free, no API key required |
| Currency | ZAR (R) | South African market |
| Build agent | Claude Code | Same workflow as Dataloop CRM |

---

## 7. Constraints

- **No native app** — must work excellently in mobile browser (Safari iOS, Chrome Android)
- **ZAR currency** — all monetary values displayed as R with 2 decimal places
- **Low cost** — free tiers of Supabase and Vercel must support single-site production use
- **No training required** — intuitive for a non-technical owner
- **Single codebase** — no monorepo complexity in v1
- **Built via Claude Code** — all implementation via Claude Code agent

---

## 8. Out of Scope (All Versions)

- Hardware integrations (POS terminals, ANPR cameras)
- White-labelling or resale platform
- Franchise / multi-owner management
- Government / SARS tax reporting
- Payroll processing

---

## 9. Reference Projects

| Project | Relevance |
|---------|-----------|
| **Dataloop CRM** | Same stack. Proven architecture and deployment workflow |
| **Matt Pocock TypeScript patterns** | TypeScript conventions throughout |
| **Open-Meteo** | Free weather API — no key needed. Docs: open-meteo.com |
