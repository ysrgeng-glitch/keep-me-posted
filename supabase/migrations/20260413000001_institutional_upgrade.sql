-- ============================================================
-- JBS Southern Australia — Institutional Intelligence Upgrade
-- Adds: verification_status, financial impact (AUD), time horizon
-- Creates: daily_briefings table
-- ============================================================

-- ── New columns on articles ──────────────────────────────────

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'UNCONFIRMED'
    CHECK (verification_status IN ('VERIFIED_OFFICIAL', 'VERIFIED_MULTI', 'ANALYST_INFERENCE', 'UNCONFIRMED')),
  ADD COLUMN IF NOT EXISTS financial_impact_low_aud  INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS financial_impact_high_aud INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS financial_impact_label    TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS time_horizon TEXT DEFAULT '90D'
    CHECK (time_horizon IN ('IMMEDIATE', '30D', '90D', '6M', '12M'));

-- Indexes for new filter columns
CREATE INDEX IF NOT EXISTS articles_verification_idx  ON articles(verification_status);
CREATE INDEX IF NOT EXISTS articles_time_horizon_idx  ON articles(time_horizon);
CREATE INDEX IF NOT EXISTS articles_fin_impact_hi_idx ON articles(financial_impact_high_aud DESC NULLS LAST);

-- ── Daily briefings table ────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_briefings (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_date DATE        NOT NULL UNIQUE,
  briefing_text TEXT        NOT NULL,
  article_ids   UUID[]      DEFAULT '{}',
  article_count INTEGER     DEFAULT 0,
  change_count  INTEGER     DEFAULT 0,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS daily_briefings_date_idx ON daily_briefings(briefing_date DESC);

-- RLS for daily_briefings
ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read briefings"
  ON daily_briefings FOR SELECT USING (true);

CREATE POLICY "Service role can manage briefings"
  ON daily_briefings FOR ALL USING (auth.role() = 'service_role');

-- ── Schedule daily briefing at 6 AM AEST weekdays ───────────
-- 6 AM AEST = 8 PM UTC (UTC+10); adjust to 7 PM UTC in summer (AEDT UTC+11)
-- Using 20:00 UTC (covers AEST 6 AM, AEDT 7 AM — acceptable window)

SELECT cron.schedule(
  'run-daily-briefing-weekdays',
  '0 20 * * 1-5',
  $$
  SELECT net.http_post(
    url     := 'https://tdbdxnujalgsccadkmiq.supabase.co/functions/v1/daily-briefing',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkYmR4bnVqYWxnc2NjYWRrbWlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA2Njg1NSwiZXhwIjoyMDkxNjQyODU1fQ.placeholder"}'::jsonb,
    body    := '{"trigger":"cron"}'::jsonb
  ) AS request_id;
  $$
);
