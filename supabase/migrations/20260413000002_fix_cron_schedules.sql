-- ============================================================
-- Fix cron schedules with correct service_role key
-- Replaces placeholder key from previous migration
-- ============================================================

-- Remove old cron jobs (idempotent)
SELECT cron.unschedule('run-daily-briefing-weekdays') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'run-daily-briefing-weekdays'
);
SELECT cron.unschedule('run-news-agent-hourly') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'run-news-agent-hourly'
);

-- ── News Agent: every hour at :00 ───────────────────────────
SELECT cron.schedule(
  'run-news-agent-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://tdbdxnujalgsccadkmiq.supabase.co/functions/v1/news-agent',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkYmR4bnVqYWxnc2NjYWRrbWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjY4NTUsImV4cCI6MjA5MTY0Mjg1NX0.Unxv35ugsfH6DiaRVb1Ne7obifkt3Uv_P-aipsI_1WQ"}'::jsonb,
    body    := '{"trigger":"cron"}'::jsonb
  ) AS request_id;
  $$
);

-- ── Daily Briefing: 6 AM AEST weekdays (20:00 UTC Mon–Fri) ──
-- Runs after the news-agent has had a chance to populate overnight articles
SELECT cron.schedule(
  'run-daily-briefing-weekdays',
  '0 20 * * 1-5',
  $$
  SELECT net.http_post(
    url     := 'https://tdbdxnujalgsccadkmiq.supabase.co/functions/v1/daily-briefing',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkYmR4bnVqYWxnc2NjYWRrbWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjY4NTUsImV4cCI6MjA5MTY0Mjg1NX0.Unxv35ugsfH6DiaRVb1Ne7obifkt3Uv_P-aipsI_1WQ"}'::jsonb,
    body    := '{"trigger":"cron"}'::jsonb
  ) AS request_id;
  $$
);
