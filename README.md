# Car Wash Manager

A mobile-first daily operations management app for South African car wash owners. Managers can log daily revenue by service type and vehicle type, record costs, mark staff attendance, and review wage summaries. Admins get an analytics dashboard with revenue trends, cost-of-sales breakdowns, and weather overlays. The app runs on Next.js 16 (App Router), Supabase (Postgres + Auth), and deploys to Vercel.

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key — server-side only, never exposed to the client |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI daily summary (v2 feature) |
| `NEXT_PUBLIC_APP_URL` | Full URL of the deployed app, e.g. `https://yourapp.vercel.app` |

Copy `.env.local.example` to `.env.local` and fill in your values before running locally.

## Local development

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase project credentials

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database migrations

Migrations live in `supabase/migrations/`. To apply them to your Supabase project:

```bash
# Push all pending migrations
npx supabase db push
```

Ensure the Supabase CLI is installed (`npm install -g supabase`) and you are logged in (`npx supabase login`).

## Deployment

The project auto-deploys to Vercel on every push to `main`.

1. Connect the repository to a Vercel project
2. Add the five environment variables above in the Vercel project settings
3. Push to `main` — Vercel builds and deploys automatically

```bash
git push origin main
```

For production, set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL (e.g. `https://yourapp.vercel.app`). This is used as the redirect URL in Supabase auth invite emails.
