-- ============================================================
-- KEEP ME POSTED — Database Schema
-- Australian Beef & Lamb Intelligence Platform
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- ============================================================
-- Articles table
-- Stores every AI-analysed news article
-- ============================================================

CREATE TABLE IF NOT EXISTS public.articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Deduplication key: SHA-256 hash of the source URL
  external_id     TEXT UNIQUE NOT NULL,
  headline        TEXT NOT NULL,
  summary         TEXT,
  why_it_matters  TEXT,
  category        TEXT CHECK (category IN (
                    'Market & Economy',
                    'Legislation / Regulation',
                    'Competition',
                    'Climate / Weather',
                    'Supply Chain',
                    'Export / Trade',
                    'Production Costs',
                    'Forecasts / Projections'
                  )),
  impact          TEXT CHECK (impact IN ('HIGH', 'MEDIUM', 'LOW')),
  regions         TEXT[]  DEFAULT '{}',
  source          TEXT,
  source_url      TEXT,
  published_at    TIMESTAMPTZ,
  short_term_impact       TEXT,
  medium_term_impact      TEXT,
  strategic_recommendation TEXT,
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  trending        BOOLEAN DEFAULT false,
  tags            TEXT[]  DEFAULT '{}',
  sentiment       FLOAT   CHECK (sentiment BETWEEN -1.0 AND 1.0),
  raw_content     TEXT,   -- original article text for audit
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_articles_published_at  ON public.articles (published_at DESC);
CREATE INDEX idx_articles_impact        ON public.articles (impact);
CREATE INDEX idx_articles_category      ON public.articles (category);
CREATE INDEX idx_articles_regions       ON public.articles USING GIN (regions);
CREATE INDEX idx_articles_tags          ON public.articles USING GIN (tags);
CREATE INDEX idx_articles_trending      ON public.articles (trending) WHERE trending = true;
CREATE INDEX idx_articles_created_at    ON public.articles (created_at DESC);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Agent runs log
-- Tracks each hourly agent execution for monitoring
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agent_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'running'
                    CHECK (status IN ('running', 'completed', 'failed')),
  sources_fetched INTEGER DEFAULT 0,
  articles_found  INTEGER DEFAULT 0,
  articles_new    INTEGER DEFAULT 0,
  articles_analysed INTEGER DEFAULT 0,
  error_message   TEXT,
  duration_ms     INTEGER
);

CREATE INDEX idx_agent_runs_started_at ON public.agent_runs (started_at DESC);

-- ============================================================
-- Row Level Security
-- Articles are publicly readable; only the service role can write
-- ============================================================

ALTER TABLE public.articles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs  ENABLE ROW LEVEL SECURITY;

-- Public read access for articles
CREATE POLICY "Articles are publicly readable"
  ON public.articles FOR SELECT
  USING (true);

-- Only service role can insert/update/delete articles
CREATE POLICY "Service role can manage articles"
  ON public.articles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Only service role can read/write agent runs
CREATE POLICY "Service role can manage agent_runs"
  ON public.agent_runs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- Scheduled cron job — run news agent every hour
-- Calls the Edge Function via HTTP
-- ============================================================

SELECT cron.schedule(
  'run-news-agent-hourly',
  '0 * * * *',  -- top of every hour
  $$
  SELECT net.http_post(
    url     := 'https://tdbdxnujalgsccadkmiq.supabase.co/functions/v1/news-agent',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkYmR4bnVqYWxnc2NjYWRrbWlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA2Njg1NSwiZXhwIjoyMDkxNjQyODU1fQ.lCj_Z7FDh7j4LNHIDBzBJ4PQrsFqFDq_3V_NCuAwM3o"}'::jsonb,
    body    := '{"trigger":"cron"}'::jsonb
  ) AS request_id;
  $$
);
