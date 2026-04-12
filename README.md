# Keep Me Posted

**AI-powered news intelligence for the Australian Beef & Lamb industry.**

An autonomous agent monitors 8+ agricultural news sources every hour, sends each article to Claude for analysis, and surfaces ranked business intelligence to a Bloomberg-inspired dashboard.

---

## Live stack

| Layer | Service | Notes |
|---|---|---|
| Frontend | Vercel | Auto-deploys from GitHub |
| Database | Supabase (PostgreSQL) | Free tier |
| AI Agent | Supabase Edge Function | Deno, runs hourly |
| LLM | Claude Haiku | ~$0.001 per article |
| News sources | RSS feeds + NewsAPI | 8 free RSS feeds built-in |

---

## Setup (15 minutes)

### 1 — Supabase project

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration:
   ```
   supabase/migrations/20240410000000_init.sql
   ```
   This creates the `articles` table, indexes, RLS policies, and the hourly cron job.

3. In **Settings → API** note your:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

4. In the SQL Editor, set the cron URL (replace with your project ref):
   ```sql
   ALTER DATABASE postgres SET app.supabase_url = 'https://YOUR_PROJECT_REF.supabase.co';
   ALTER DATABASE postgres SET app.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
   ```

### 2 — Deploy the Edge Function (AI agent)

Install the Supabase CLI:
```bash
npm install -g supabase
```

Link to your project and deploy:
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy news-agent
```

Set the secrets the function needs:
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
supabase secrets set NEWS_API_KEY=xxxx   # optional
```

Test it runs correctly:
```bash
supabase functions invoke news-agent --no-verify-jwt
```

You should see a JSON response like:
```json
{ "ok": true, "articles_found": 47, "articles_new": 12, "articles_analysed": 9 }
```

### 3 — Get API keys

| Key | Where | Cost |
|---|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | ~$0.001/article |
| `NEWS_API_KEY` | [newsapi.org](https://newsapi.org) | Free (100 req/day) |

The agent works on RSS feeds alone (free, no quota) — NewsAPI is optional but improves coverage.

### 4 — Deploy frontend to Vercel

```bash
npm install -g vercel
vercel
```

When prompted, set environment variables:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Or connect the GitHub repo in the Vercel dashboard for automatic deploys on every push.

---

## Local development

```bash
# Install dependencies
npm install

# Copy env template
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
# Leave them blank to use built-in mock data

npm run dev
```

The app shows **mock data** when Supabase credentials are absent — so it works locally with zero setup.

---

## How the AI agent works

```
Every hour (pg_cron):
  ┌─────────────────────────────────────────────────────┐
  │  news-agent Edge Function                           │
  │                                                     │
  │  1. Fetch 8 RSS feeds (Beef Central, ABC Rural,     │
  │     The Land, Farm Online, Sheep Central, MLA…)     │
  │  2. Fetch NewsAPI (optional)                        │
  │  3. Deduplicate against DB (SHA-256 of URL)         │
  │  4. Pre-filter: discard non-agriculture articles    │
  │  5. For each new article → Claude Haiku:            │
  │       • Headline + 2-4 sentence summary             │
  │       • Impact level (HIGH / MEDIUM / LOW)          │
  │       • Region tags (SA / VIC / NSW / TAS)          │
  │       • Short & medium-term impact                  │
  │       • Strategic recommendation                    │
  │       • Confidence score + sentiment                │
  │  6. Bulk insert to Supabase                         │
  │  7. Frontend receives via Realtime subscription     │
  └─────────────────────────────────────────────────────┘
```

---

## Project structure

```
keep-me-posted/
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── 20240410000000_init.sql    ← DB schema + cron
│   └── functions/
│       └── news-agent/
│           └── index.ts               ← AI agent (Deno)
├── src/
│   ├── lib/supabase.js                ← Supabase client
│   ├── hooks/useNews.js               ← data hook (live + mock)
│   ├── data/mockData.js               ← fallback mock articles
│   ├── utils/scoring.js               ← impact scoring engine
│   ├── components/
│   │   ├── layout/                    ← Sidebar, Header, Layout
│   │   ├── common/                    ← ImpactBadge, RegionTag…
│   │   ├── dashboard/                 ← KPICards, AlertBanner…
│   │   ├── news/                      ← NewsCard, NewsFilters
│   │   └── forecast/                  ← ForecastChart, Signals
│   └── pages/
│       ├── Dashboard.jsx
│       ├── NewsFeed.jsx
│       ├── ArticleDetail.jsx
│       └── Forecast.jsx
├── vercel.json
└── .env.example
```

---

## Estimated running costs

| Item | Cost |
|---|---|
| Supabase (free tier) | $0/mo |
| Vercel (hobby) | $0/mo |
| Claude Haiku (~200 articles/day) | ~$6/mo |
| NewsAPI (free) | $0/mo |
| **Total** | **~$6/mo** |
