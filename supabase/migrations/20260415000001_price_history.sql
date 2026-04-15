-- ====================================================
-- Grasshopper News — Price History Table
-- Stores weekly MLA livestock price snapshots for
-- trend analysis and forecast chart generation.
-- ====================================================

CREATE TABLE IF NOT EXISTS price_history (
  id           BIGSERIAL PRIMARY KEY,
  week_start   DATE        NOT NULL UNIQUE,   -- ISO week Monday (YYYY-MM-DD)
  beef_price   NUMERIC(8,2),                  -- cents/kg liveweight (e.g. 456 = $4.56/kg)
  lamb_price   NUMERIC(8,2),                  -- cents/kg cwt
  mutton_price NUMERIC(8,2),                  -- cents/kg cwt
  audusd       NUMERIC(6,4),                  -- e.g. 0.6350
  beef_name    TEXT,                          -- 'EYCI' | 'Feeder Steer' | etc.
  lamb_name    TEXT,                          -- 'Trade Lamb' | 'Light Lamb' | etc.
  source       TEXT DEFAULT 'MLA',
  is_fallback  BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS price_history_week_start_idx ON price_history (week_start DESC);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_price_history_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS price_history_updated_at ON price_history;
CREATE TRIGGER price_history_updated_at
  BEFORE UPDATE ON price_history
  FOR EACH ROW EXECUTE FUNCTION update_price_history_updated_at();

-- RLS: read-only for anon/authenticated, write only via service role
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_history_select" ON price_history
  FOR SELECT USING (true);

-- Seed with known MLA historical data (Oct 2025 – Apr 2026)
-- Beef: Feeder Steer Indicator cents/kg lw | Lamb: Light Lamb Indicator cents/kg cwt
INSERT INTO price_history (week_start, beef_price, lamb_price, mutton_price, beef_name, lamb_name, is_fallback)
VALUES
  ('2025-09-29', 545, 980,  720, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2025-10-06', 545, 980,  720, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2025-10-13', 538, 995,  728, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2025-10-20', 534, 1005, 735, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2025-10-27', 530, 1012, 742, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2025-11-03', 526, 1018, 748, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2025-11-10', 522, 1025, 754, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2025-11-17', 518, 1038, 761, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2025-11-24', 514, 1042, 768, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2025-12-01', 510, 1052, 775, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2025-12-08', 508, 1058, 782, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2025-12-15', 506, 1062, 788, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2025-12-22', 505, 1065, 793, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2025-12-29', 503, 1068, 796, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2026-01-05', 500, 1072, 800, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2026-01-12', 497, 1080, 804, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2026-01-19', 494, 1088, 807, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2026-01-26', 491, 1095, 810, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2026-02-02', 488, 1102, 810, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2026-02-09', 484, 1112, 812, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2026-02-16', 481, 1120, 814, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2026-02-23', 478, 1128, 813, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2026-03-02', 475, 1138, 813, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2026-03-09', 472, 1148, 814, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2026-03-16', 468, 1158, 814, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2026-03-23', 464, 1165, 814, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2026-03-30', 460, 1170, 814, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2026-04-06', 457, 1185, 814, 'Feeder Steer', 'Light Lamb', FALSE),
  ('2026-04-13', 456, 1193, 814, 'Feeder Steer', 'Light Lamb', FALSE)
ON CONFLICT (week_start) DO NOTHING;
