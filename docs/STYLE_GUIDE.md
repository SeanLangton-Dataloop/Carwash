# Car Wash Manager — Style Guide

> **Read this before building any UI component.**
> Defines colours, spacing, typography, component patterns, and Tailwind conventions.
> All UI is built from scratch — no third-party component library (see DECISIONS.md).

---

## 1. Design Principles

- **Mobile-first** — design for a 390px screen first, then scale up
- **Touch-friendly** — minimum 44px touch targets on all interactive elements
- **No iOS zoom** — all `<input>` and `<select>` elements use `text-base` (16px minimum)
- **ZAR currency** — all monetary values via `formatZAR()` — never hardcode `R` with a number
- **Accessible** — all interactive elements have `focus:ring-2 focus:ring-sky-500 focus:outline-none`

---

## 2. Colour System

### CSS Variables (`src/app/globals.css`)

```css
@import "tailwindcss";

:root {
  /* Brand */
  --color-sky-50:  #f0f9ff;
  --color-sky-100: #e0f2fe;
  --color-sky-500: #0ea5e9;
  --color-sky-600: #0284c7;
  --color-sky-700: #0369a1;

  /* Neutrals */
  --color-neutral-50:  #fafafa;
  --color-neutral-100: #f5f5f5;
  --color-neutral-200: #e5e5e5;
  --color-neutral-300: #d4d4d4;
  --color-neutral-400: #a3a3a3;
  --color-neutral-500: #737373;
  --color-neutral-600: #525252;
  --color-neutral-700: #404040;
  --color-neutral-800: #262626;
  --color-neutral-900: #171717;

  /* Semantic */
  --color-success-50:  #f0fdf4;
  --color-success-600: #16a34a;
  --color-error-50:    #fef2f2;
  --color-error-600:   #dc2626;
  --color-warning-50:  #fffbeb;
  --color-warning-600: #d97706;

  /* Surfaces */
  --color-background: #f5f5f5;   /* page background */
  --color-surface:    #ffffff;   /* card/panel background */
  --color-border:     #e5e5e5;   /* default border */

  /* Chart colours (for Recharts) */
  --color-chart-revenue:  #0ea5e9;   /* sky-500 — primary bars */
  --color-chart-cash:     #16a34a;   /* green — cash */
  --color-chart-card:     #0ea5e9;   /* sky — card */
  --color-chart-cos:      #f97316;   /* orange — cost of sales */
  --color-chart-capex:    #a855f7;   /* purple — capex */
  --color-chart-profit:   #16a34a;   /* green — gross profit */

  /* Weather dot colours */
  --color-weather-clear:  #fbbf24;   /* amber */
  --color-weather-cloud:  #9ca3af;   /* grey */
  --color-weather-rain:   #60a5fa;   /* blue */
  --color-weather-storm:  #3730a3;   /* indigo */

  /* Typography */
  --font-sans: ui-sans-serif, system-ui, -apple-system, sans-serif;

  /* Layout */
  --sidebar-width: 240px;
  --bottom-nav-height: 64px;
}
```

### Colour Usage Rules

| Purpose | Tailwind class / CSS var |
|---------|-------------------------|
| Primary action (button, link, active state) | `bg-sky-500`, `text-sky-600` |
| Page background | `bg-neutral-100` |
| Card / panel background | `bg-white` |
| Body text | `text-neutral-900` |
| Secondary / muted text | `text-neutral-500` |
| Border | `border-neutral-200` |
| Error text | `text-red-600` |
| Error background | `bg-red-50` |
| Success text | `text-green-600` |
| Success background | `bg-green-50` |
| Warning text | `text-amber-600` |
| Warning background | `bg-amber-50` |

**Never hardcode hex values** in component files. Always use Tailwind classes or CSS variables.

---

## 3. Typography

| Element | Classes |
|---------|---------|
| Page heading (h1) | `text-xl font-semibold text-neutral-900` |
| Section heading (h2) | `text-base font-semibold text-neutral-900` |
| Body text | `text-sm text-neutral-700` |
| Muted / helper text | `text-xs text-neutral-500` |
| Label | `text-sm font-medium text-neutral-700` |
| Stat card number | `text-2xl font-bold text-neutral-900` |
| Stat card label | `text-xs font-medium text-neutral-500 uppercase tracking-wide` |
| Table header | `text-xs font-semibold text-neutral-500 uppercase tracking-wide` |
| Table cell | `text-sm text-neutral-900` |
| ZAR amount (prominent) | `text-lg font-semibold text-neutral-900` |

---

## 4. Spacing and Layout

### Page container

```tsx
<div className="min-h-screen bg-neutral-100">
  <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-6">
    {/* pb-24 on mobile = clear of bottom nav */}
    {/* max-w-2xl keeps content readable on desktop */}
  </div>
</div>
```

### Section spacing

- Between major sections: `space-y-6`
- Within a card: `p-4` (mobile) / `p-6` (desktop: `md:p-6`)
- Between form fields: `space-y-4`
- Between label and input: `mt-1`

---

## 5. Component Patterns

### Card

```tsx
// src/components/ui/Card.tsx
interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={`rounded-xl bg-white shadow-sm border border-neutral-200 ${className ?? ''}`}>
      {children}
    </div>
  )
}
```

Usage:
```tsx
<Card>
  <div className="p-4 md:p-6">
    {/* content */}
  </div>
</Card>
```

### Stat Card

```tsx
<Card>
  <div className="p-4">
    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
      Today's Revenue
    </p>
    <p className="mt-1 text-2xl font-bold text-neutral-900">
      {formatZAR(todayRevenue)}
    </p>
  </div>
</Card>
```

### Button

```tsx
// src/components/ui/Button.tsx

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  isLoading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-sky-500 text-white hover:bg-sky-600 active:bg-sky-700',
  secondary: 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50',
  ghost:     'text-neutral-600 hover:bg-neutral-100',
  danger:    'bg-red-600 text-white hover:bg-red-700',
}

export function Button({
  variant = 'primary',
  isLoading = false,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center rounded-lg px-4 py-2.5
        text-sm font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        min-h-[44px]
        ${variantClasses[variant]}
        ${className ?? ''}
      `}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  )
}
```

### Input

```tsx
// src/components/ui/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <div className={label ? 'mt-1' : ''}>
        <input
          id={id}
          className={`
            block w-full rounded-lg border px-3 py-2.5 text-base
            text-neutral-900 placeholder:text-neutral-400
            focus:outline-none focus:ring-2 focus:ring-sky-500
            disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500
            ${error ? 'border-red-400 bg-red-50' : 'border-neutral-300 bg-white'}
            ${className ?? ''}
          `}
          {...props}
        />
      </div>
      {hint && !error && (
        <p className="mt-1 text-xs text-neutral-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
```

**Critical:** `text-base` on `<input>` is mandatory. It prevents iOS Safari from zooming on focus.

### Select

```tsx
// src/components/ui/Select.tsx
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export function Select({ label, error, children, id, className, ...props }: SelectProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <div className={label ? 'mt-1' : ''}>
        <select
          id={id}
          className={`
            block w-full rounded-lg border px-3 py-2.5 text-base
            text-neutral-900 bg-white
            focus:outline-none focus:ring-2 focus:ring-sky-500
            ${error ? 'border-red-400' : 'border-neutral-300'}
            ${className ?? ''}
          `}
          {...props}
        >
          {children}
        </select>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
```

**Critical:** `text-base` on `<select>` is mandatory. Same iOS zoom prevention.

### ZAR Input (with prefix)

```tsx
{/* Use for all monetary inputs */}
<div>
  <label className="block text-sm font-medium text-neutral-700">Amount</label>
  <div className="mt-1 flex rounded-lg border border-neutral-300 focus-within:ring-2 focus-within:ring-sky-500">
    <span className="flex items-center rounded-l-lg bg-neutral-100 px-3 text-sm text-neutral-500 border-r border-neutral-300">
      R
    </span>
    <input
      type="text"
      inputMode="decimal"
      className="block w-full rounded-r-lg px-3 py-2.5 text-base text-neutral-900 focus:outline-none"
      placeholder="0.00"
    />
  </div>
</div>
```

### Badge

```tsx
// src/components/ui/Badge.tsx
type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-neutral-100 text-neutral-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  error:   'bg-red-50 text-red-700',
  info:    'bg-sky-50 text-sky-700',
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  )
}
```

---

## 6. Form Patterns

### Full form layout

```tsx
<form onSubmit={handleSubmit} className="space-y-4">
  <Input
    id="description"
    label="Description"
    type="text"
    required
    placeholder="e.g. Cleaning chemicals — Pick n Pay"
    error={errors.description}
  />

  <Select id="category" label="Category" error={errors.category}>
    <option value="">Select category...</option>
    <option value="cos">Cleaning / Consumables</option>
    <option value="capex">Equipment (CapEx)</option>
  </Select>

  {/* ZAR amount input */}
  <div>
    <label className="block text-sm font-medium text-neutral-700">Amount</label>
    <div className="mt-1 flex rounded-lg border border-neutral-300 focus-within:ring-2 focus-within:ring-sky-500">
      <span className="flex items-center rounded-l-lg bg-neutral-100 px-3 text-sm text-neutral-500 border-r border-neutral-300">R</span>
      <input type="text" inputMode="decimal" className="block w-full rounded-r-lg px-3 py-2.5 text-base text-neutral-900 focus:outline-none" />
    </div>
  </div>

  {/* Error banner */}
  {submitError && (
    <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
      {submitError}
    </div>
  )}

  <Button type="submit" isLoading={isSubmitting} className="w-full">
    Save purchase
  </Button>
</form>
```

### Error banner (inline, not toast)

```tsx
{error && (
  <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
    {error}
  </div>
)}
```

### Success toast (temporary notification)

```tsx
// Simple toast — appears at bottom of screen for 3 seconds
{toast && (
  <div
    role="status"
    className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white shadow-lg md:bottom-6"
  >
    {toast}
  </div>
)}
```

---

## 7. List and Table Patterns

### Simple list (e.g. cost history)

```tsx
<Card>
  <ul className="divide-y divide-neutral-100">
    {items.map(item => (
      <li key={item.id} className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-sm font-medium text-neutral-900">{item.description}</p>
          <p className="text-xs text-neutral-500">{item.date}</p>
        </div>
        <span className="text-sm font-semibold text-neutral-900">
          {formatZAR(item.amount)}
        </span>
      </li>
    ))}
  </ul>
</Card>
```

### Data table (e.g. wage summary, revenue matrix)

```tsx
<div className="overflow-x-auto rounded-xl border border-neutral-200">
  <table className="min-w-full divide-y divide-neutral-200">
    <thead className="bg-neutral-50">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
          Name
        </th>
        <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">
          Daily Rate
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-neutral-100 bg-white">
      {rows.map(row => (
        <tr key={row.id} className="hover:bg-neutral-50">
          <td className="px-4 py-3 text-sm text-neutral-900">{row.name}</td>
          <td className="px-4 py-3 text-sm text-right text-neutral-900">
            {formatZAR(row.dailyRate)}
          </td>
        </tr>
      ))}
    </tbody>
    <tfoot className="bg-neutral-50 border-t border-neutral-200">
      <tr>
        <td className="px-4 py-3 text-sm font-semibold text-neutral-900">Total</td>
        <td className="px-4 py-3 text-sm font-semibold text-right text-neutral-900">
          {formatZAR(total)}
        </td>
      </tr>
    </tfoot>
  </table>
</div>
```

---

## 8. Loading Skeletons

Use `animate-pulse` for all loading states. Match the shape of the real content.

```tsx
// src/components/ui/Skeleton.tsx
interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={`animate-pulse rounded bg-neutral-200 ${className ?? ''}`} />
  )
}
```

### Stat card skeleton

```tsx
<Card>
  <div className="p-4 space-y-2">
    <Skeleton className="h-3 w-24" />
    <Skeleton className="h-7 w-32" />
  </div>
</Card>
```

### List skeleton

```tsx
<Card>
  <div className="divide-y divide-neutral-100">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center justify-between px-4 py-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
    ))}
  </div>
</Card>
```

### Chart skeleton

```tsx
<Card>
  <div className="p-4 md:p-6">
    <Skeleton className="h-4 w-32 mb-4" />
    <Skeleton className="h-60 w-full" />
  </div>
</Card>
```

---

## 9. Empty States

Every list page must have an empty state when there's no data.

```tsx
// src/components/ui/EmptyState.tsx
interface EmptyStateProps {
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
      <p className="text-sm font-semibold text-neutral-900">{title}</p>
      <p className="mt-1 text-sm text-neutral-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
```

Usage:
```tsx
<EmptyState
  title="No revenue entries yet"
  description="Log your first day's revenue to get started."
  action={
    <Button onClick={() => router.push('/revenue/new')}>
      Log today's revenue
    </Button>
  }
/>
```

---

## 10. Navigation Layout

### Bottom nav (mobile, `< md`)

```tsx
// src/components/layout/BottomNav.tsx
// Fixed to bottom. Height: 64px. Background: white. Border-top: neutral-200.
// 5 tabs: Dashboard | Revenue | Costs | Wages | Menu
// Active tab: text-sky-500 and a small sky-500 dot/indicator above the label
// Inactive tab: text-neutral-500
// Each tab: min-h-[44px], flex-1, flex-col items-center justify-center, text-xs
```

### Sidebar (desktop, `>= md`)

```tsx
// src/components/layout/Sidebar.tsx
// Fixed left side. Width: 240px. Background: white. Border-right: neutral-200.
// App name at top with sky-500 accent
// Nav links: px-3 py-2, rounded-lg, text-sm font-medium
// Active: bg-sky-50 text-sky-700
// Inactive: text-neutral-600 hover:bg-neutral-100
// User info at bottom: name + role badge
```

### AppShell

```tsx
// src/components/layout/AppShell.tsx
'use client'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-[240px] md:flex-col">
        <Sidebar />
      </div>

      {/* Main content — offset by sidebar on desktop */}
      <main className="min-h-screen bg-neutral-100 md:pl-[240px]">
        {children}
      </main>

      {/* Bottom nav — hidden on desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <BottomNav />
      </div>
    </>
  )
}
```

---

## 11. Chart Colour Reference (Recharts)

Use CSS variables in Recharts fill/stroke props to stay consistent:

| Data series | CSS variable | Colour |
|-------------|-------------|--------|
| Revenue bars | `var(--color-chart-revenue)` | sky blue |
| Cash | `var(--color-chart-cash)` | green |
| Card | `var(--color-chart-card)` | sky blue |
| Cost of Sales | `var(--color-chart-cos)` | orange |
| CapEx | `var(--color-chart-capex)` | purple |
| Gross profit | `var(--color-chart-profit)` | green |

### Weather dot colours (overlaid on revenue chart)

| Condition | Dot colour | CSS variable |
|-----------|-----------|-------------|
| Clear / mainly clear | Amber | `var(--color-weather-clear)` |
| Cloudy / overcast | Grey | `var(--color-weather-cloud)` |
| Drizzle / rain | Blue | `var(--color-weather-rain)` |
| Thunderstorm | Indigo | `var(--color-weather-storm)` |

---

## 12. Toggle / Attendance Pattern

Used on the attendance page for present/absent marking.

```tsx
// Present/Absent toggle for each staff member
<button
  type="button"
  onClick={() => togglePresent(staffId)}
  className={`
    inline-flex items-center rounded-full px-4 py-2 text-sm font-medium
    min-h-[44px] transition-colors
    focus:outline-none focus:ring-2 focus:ring-sky-500
    ${present
      ? 'bg-green-100 text-green-800'
      : 'bg-neutral-100 text-neutral-500'
    }
  `}
  aria-pressed={present}
>
  {present ? 'Present' : 'Absent'}
</button>
```

---

## 13. Page Header Pattern

Consistent header across all pages.

```tsx
<div className="flex items-center justify-between mb-6">
  <h1 className="text-xl font-semibold text-neutral-900">Revenue</h1>
  <Button onClick={() => router.push('/revenue/new')}>
    Log today
  </Button>
</div>
```

---

## 14. Auth Page Layout

Auth pages (`/login`, `/reset-password`) have their own centred layout — no sidebar or bottom nav.

```tsx
// src/app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 px-4">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-sky-600">Car Wash Manager</h1>
      </div>
      <div className="w-full max-w-sm rounded-xl bg-white shadow-sm border border-neutral-200 p-6">
        {children}
      </div>
    </div>
  )
}
```

---

## 15. Revenue Entry Matrix

The revenue entry form uses a scrollable table with quantity inputs per cell.

```tsx
// Outer wrapper — horizontal scroll on narrow screens
<div className="overflow-x-auto -mx-4 px-4">
  <table className="min-w-[600px] w-full">
    <thead>
      <tr>
        <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide pb-2 pr-4">
          Service
        </th>
        {vehicleTypes.map(v => (
          <th key={v.name} className="text-center text-xs font-semibold text-neutral-500 uppercase tracking-wide pb-2 px-2">
            {v.name}
          </th>
        ))}
        <th className="text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide pb-2 pl-4">
          Total
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-neutral-100">
      {serviceTypes.map(service => (
        <tr key={service.name}>
          <td className="py-3 pr-4 text-sm font-medium text-neutral-900 whitespace-nowrap">
            {service.name}
          </td>
          {vehicleTypes.map(vehicle => (
            <td key={vehicle.name} className="py-3 px-2">
              <input
                type="text"
                inputMode="numeric"
                className="w-16 rounded-lg border border-neutral-300 px-2 py-1.5 text-base text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="0"
              />
            </td>
          ))}
          <td className="py-3 pl-4 text-sm font-semibold text-neutral-900 text-right whitespace-nowrap">
            {formatZAR(rowTotal)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## 16. Checklist Before Submitting Any UI Prompt

Before finishing any UI-related Claude Code session, verify:

- [ ] All `<input>` and `<select>` elements have `text-base` class
- [ ] All interactive elements have `min-h-[44px]` or equivalent touch target
- [ ] All interactive elements have `focus:outline-none focus:ring-2 focus:ring-sky-500`
- [ ] All monetary values go through `formatZAR()` — no raw numbers with `R` prefix
- [ ] No hardcoded hex colour values — use Tailwind classes only
- [ ] Empty state exists on all list/data pages
- [ ] Loading skeleton exists on all data-fetching pages
- [ ] Error state shown inline (not console.log)
- [ ] `pb-24` on mobile page containers (clears bottom nav)
- [ ] Charts wrapped in `dynamic()` with `ssr: false`
