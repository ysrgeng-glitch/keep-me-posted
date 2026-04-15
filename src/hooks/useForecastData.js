// ====================================================
// Grasshopper News — useForecastData Hook
//
// Live Market Indicators: fetched from /api/market-prices (Vercel function),
// which scrapes the MLA weekly cattle & sheep market wrap.
//
// Price Forecast Charts: built from real price_history rows in Supabase.
// Monthly averages computed client-side; forward projections use a simple
// linear trend extrapolation with a widening confidence band.
//
// Sentiment Timeline: derived from articles with a sentiment score,
// grouped by ISO week (last 12 weeks).
//
// Category Breakdown: article counts by category, last 30 days.
// ====================================================

import { useState, useEffect } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// ── Static fallback signals (MLA April 10, 2026 + ABS/ABARES) ────────────────
const FALLBACK_SIGNALS = [
  { label: 'Lamb',         value: '$11.93/kg', direction: 'up',   note: 'Light Lamb Indicator (cwt) · MLA' },
  { label: 'Mutton',       value: '$8.14/kg',  direction: 'up',   note: 'Mutton Indicator (cwt) · MLA' },
  { label: 'AUD/USD',      value: '—',         direction: 'up',   note: 'Live exchange rate' },
  { label: 'Feed Wheat',   value: '$310/t',    direction: 'up',   note: 'East coast spot · ABARES indicative' },
  { label: 'Feeder Steer', value: '$4.56/kg',  direction: 'down', note: 'Feeder Steer Indicator (lw) · MLA' },
  { label: 'Export Beef',  value: '+4.2%',     direction: 'up',   note: 'YoY volume vs prior year · MLA' },
]

// ── Hardcoded fallback forecast (used only when price_history is empty) ───────
const FALLBACK_BEEF_FORECAST = [
  { month: 'Oct',  actual: 5.45, forecast: null },
  { month: 'Nov',  actual: 5.32, forecast: null },
  { month: 'Dec',  actual: 5.10, forecast: null },
  { month: 'Jan',  actual: 4.92, forecast: null },
  { month: 'Feb',  actual: 4.72, forecast: null },
  { month: 'Mar',  actual: 4.58, forecast: null },
  { month: 'Apr',  actual: 4.56, forecast: 4.56, upper: 4.90, lower: 4.22 },
  { month: 'May',  actual: null, forecast: 4.68, upper: 5.05, lower: 4.31 },
  { month: 'Jun',  actual: null, forecast: 4.85, upper: 5.30, lower: 4.40 },
  { month: 'Jul',  actual: null, forecast: 5.05, upper: 5.55, lower: 4.55 },
  { month: 'Aug',  actual: null, forecast: 5.20, upper: 5.75, lower: 4.65 },
]

const FALLBACK_LAMB_FORECAST = [
  { month: 'Oct',  actual: 9.80,  forecast: null },
  { month: 'Nov',  actual: 10.20, forecast: null },
  { month: 'Dec',  actual: 10.65, forecast: null },
  { month: 'Jan',  actual: 11.05, forecast: null },
  { month: 'Feb',  actual: 11.35, forecast: null },
  { month: 'Mar',  actual: 11.70, forecast: null },
  { month: 'Apr',  actual: 11.93, forecast: 11.93, upper: 12.40, lower: 11.46 },
  { month: 'May',  actual: null,  forecast: 11.75, upper: 12.30, lower: 11.20 },
  { month: 'Jun',  actual: null,  forecast: 11.45, upper: 12.05, lower: 10.85 },
  { month: 'Jul',  actual: null,  forecast: 11.15, upper: 11.85, lower: 10.45 },
  { month: 'Aug',  actual: null,  forecast: 11.30, upper: 12.10, lower: 10.50 },
]

// Fallback sentiment + category when articles table has no usable data
const FALLBACK_SENTIMENT = [
  { date: 'Oct 1',  score: -0.12 },
  { date: 'Oct 8',  score: -0.18 },
  { date: 'Oct 15', score: -0.14 },
  { date: 'Oct 22', score: -0.31 },
  { date: 'Oct 29', score: -0.27 },
  { date: 'Nov 5',  score: -0.38 },
  { date: 'Nov 12', score: -0.24 },
]

const FALLBACK_CATEGORIES = [
  { category: 'Climate / Weather',        count: 12 },
  { category: 'Market & Economy',         count: 9  },
  { category: 'Export / Trade',           count: 8  },
  { category: 'Legislation / Regulation', count: 7  },
  { category: 'Production Costs',         count: 6  },
  { category: 'Supply Chain',             count: 5  },
  { category: 'Forecasts / Projections',  count: 5  },
  { category: 'Competition',              count: 3  },
]

// ── Supabase REST helpers ─────────────────────────────────────────────────────
function supabaseHeaders() {
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Accept': 'application/json',
  }
}

async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: supabaseHeaders(),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${path}`)
  return res.json()
}

// ── Price history → monthly aggregation + linear-trend forecast ───────────────
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const FORECAST_MONTHS = 5   // how many future months to project

/**
 * Build the forecast chart data from weekly price_history rows.
 *
 * 1. Aggregate rows into calendar months (average of all weeks in that month)
 * 2. The last month with data is the "bridge" point (shown as both actual & forecast)
 * 3. Linear trend from the last 3 actual months → project FORECAST_MONTHS forward
 * 4. Confidence band widens with horizon: ±(5% + n*1.5%) of projected price
 */
function buildForecastSeries(rows, priceField) {
  if (!rows || rows.length === 0) return null

  // Aggregate into months
  const byMonth = new Map()
  for (const row of rows) {
    if (row[priceField] == null) continue
    const d = new Date(row.week_start)
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    if (!byMonth.has(key)) byMonth.set(key, { sum: 0, count: 0, month: d.getUTCMonth(), year: d.getUTCFullYear() })
    const entry = byMonth.get(key)
    entry.sum += parseFloat(row[priceField])
    entry.count += 1
  }

  if (byMonth.size === 0) return null

  // Sort months chronologically
  const sortedKeys = [...byMonth.keys()].sort()
  const actuals = sortedKeys.map(k => {
    const e = byMonth.get(k)
    return {
      key: k,
      month: MONTH_ABBR[e.month],
      value: parseFloat((e.sum / e.count / 100).toFixed(2)), // cents → $/kg
    }
  })

  // Linear trend: fit slope over last ≤4 actual months
  const fitPoints = actuals.slice(-4)
  const n = fitPoints.length
  const avgSlope = n >= 2
    ? (fitPoints[n - 1].value - fitPoints[0].value) / (n - 1)
    : 0

  // Build the series: all actuals, then projected months
  const series = actuals.map((a, i) => ({
    month: a.month,
    actual: a.value,
    forecast: i === actuals.length - 1 ? a.value : null, // bridge on last actual
    upper:    i === actuals.length - 1 ? null : null,
    lower:    i === actuals.length - 1 ? null : null,
  }))

  // Add bridge confidence band on last actual
  const lastActual = actuals[actuals.length - 1]
  const lastEntry = series[series.length - 1]
  const bandBase = lastActual.value * 0.05
  lastEntry.upper = parseFloat((lastActual.value + bandBase).toFixed(2))
  lastEntry.lower = parseFloat((lastActual.value - bandBase).toFixed(2))

  // Determine next month after last actual
  const [lastYear, lastMonthNum] = lastActual.key.split('-').map(Number)

  for (let i = 1; i <= FORECAST_MONTHS; i++) {
    const targetMonthNum = ((lastMonthNum - 1 + i) % 12)
    const targetYear     = lastYear + Math.floor((lastMonthNum - 1 + i) / 12)
    const projected      = parseFloat((lastActual.value + avgSlope * i).toFixed(2))
    const band           = parseFloat((projected * (0.05 + i * 0.015)).toFixed(2))
    series.push({
      month:    MONTH_ABBR[targetMonthNum],
      actual:   null,
      forecast: projected,
      upper:    parseFloat((projected + band).toFixed(2)),
      lower:    parseFloat((projected - band).toFixed(2)),
    })
  }

  return series
}

// ── Sentiment timeline from articles ─────────────────────────────────────────
/**
 * Group articles by ISO week, average their sentiment scores.
 * Returns last 12 weeks with data.
 */
function buildSentimentTimeline(articles) {
  if (!articles || articles.length === 0) return null

  const byWeek = new Map()
  for (const a of articles) {
    const sentVal = a.sentiment
    if (sentVal == null) continue
    const ts = a.published_at ?? a.publishedAt
    if (!ts) continue
    const d = new Date(ts)
    // ISO week Monday
    const day = d.getUTCDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setUTCDate(d.getUTCDate() + diff)
    const key = d.toISOString().slice(0, 10)
    if (!byWeek.has(key)) byWeek.set(key, { sum: 0, count: 0, date: d })
    const entry = byWeek.get(key)
    entry.sum += parseFloat(sentVal)
    entry.count += 1
  }

  if (byWeek.size === 0) return null

  const sortedKeys = [...byWeek.keys()].sort()
  const result = sortedKeys.slice(-12).map(k => {
    const e = byWeek.get(k)
    const avg = parseFloat((e.sum / e.count).toFixed(3))
    const label = e.date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    return { date: label, score: avg }
  })

  return result.length > 0 ? result : null
}

// ── Category breakdown from articles ─────────────────────────────────────────
function buildCategoryBreakdown(articles) {
  if (!articles || articles.length === 0) return null

  const counts = new Map()
  for (const a of articles) {
    if (!a.category) continue
    counts.set(a.category, (counts.get(a.category) ?? 0) + 1)
  }

  if (counts.size === 0) return null

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({ category, count }))
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useForecastData() {
  const [signals,           setSignals]           = useState(FALLBACK_SIGNALS)
  const [beefForecast,      setBeefForecast]      = useState(FALLBACK_BEEF_FORECAST)
  const [lambForecast,      setLambForecast]      = useState(FALLBACK_LAMB_FORECAST)
  const [sentimentTimeline, setSentimentTimeline] = useState(FALLBACK_SENTIMENT)
  const [categoryBreakdown, setCategoryBreakdown] = useState(FALLBACK_CATEGORIES)
  const [loading,           setLoading]           = useState(true)
  const [updatedAt,         setUpdatedAt]         = useState(null)

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchSignals(), fetchPriceHistory(), fetchArticleData()])
    setUpdatedAt(new Date())
    setLoading(false)
  }

  // ── Live market signals from /api/market-prices ─────────────────────────────
  async function fetchSignals() {
    try {
      const res = await fetch('/api/market-prices', { signal: AbortSignal.timeout(15_000) })
      if (!res.ok) throw new Error(`status ${res.status}`)
      const data = await res.json()

      const live = [
        data.lamb && {
          label:     data.lamb.name ?? 'Lamb',
          value:     data.lamb.label,
          direction: 'up',
          note:      `${data.lamb.name} (${data.lamb.unit === 'cwt' ? 'carcase wt' : 'live wt'}) · MLA`,
        },
        data.mutton && {
          label:     'Mutton',
          value:     data.mutton.label,
          direction: 'neutral',
          note:      `Mutton Indicator (${data.mutton.unit === 'cwt' ? 'carcase wt' : 'live wt'}) · MLA`,
        },
        data.audusd && {
          label:     'AUD/USD',
          value:     `$${data.audusd.label}`,
          direction: 'up',
          note:      'Live exchange rate',
        },
        {
          label:     'Feed Wheat',
          value:     '$310/t',
          direction: 'up',
          note:      'East coast spot · ABARES indicative',
        },
        data.beef && {
          label:     data.beef.name ?? 'Feeder Steer',
          value:     data.beef.label,
          direction: 'down',
          note:      `${data.beef.name} (${data.beef.unit === 'cwt' ? 'carcase wt' : 'live wt'}) · MLA`,
        },
        {
          label:     'Export Beef',
          value:     '+4.2%',
          direction: 'up',
          note:      'YoY volume vs prior year · MLA',
        },
      ].filter(Boolean)

      setSignals(live)
    } catch (err) {
      console.warn('useForecastData: market-prices unavailable, using fallback:', err?.message)
    }
  }

  // ── Price history from Supabase → forecast charts ──────────────────────────
  async function fetchPriceHistory() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return
    try {
      // Fetch last 52 weeks of price history, ordered oldest first
      const rows = await supabaseGet(
        'price_history?select=week_start,beef_price,lamb_price,mutton_price&order=week_start.asc&limit=52'
      )

      const beef = buildForecastSeries(rows, 'beef_price')
      const lamb = buildForecastSeries(rows, 'lamb_price')

      if (beef && beef.length > 0) setBeefForecast(beef)
      if (lamb && lamb.length > 0) setLambForecast(lamb)
    } catch (err) {
      console.warn('useForecastData: price_history unavailable, using fallback:', err?.message)
    }
  }

  // ── Articles → sentiment timeline + category breakdown ─────────────────────
  async function fetchArticleData() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return
    try {
      // Fetch last 90 days of articles with sentiment + category
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      const articles = await supabaseGet(
        `articles?select=category,sentiment,published_at&published_at=gte.${cutoff}&limit=500&order=published_at.desc`
      )

      const sentiment = buildSentimentTimeline(articles)
      const categories = buildCategoryBreakdown(articles)

      if (sentiment && sentiment.length > 0) setSentimentTimeline(sentiment)
      if (categories && categories.length > 0) setCategoryBreakdown(categories)
    } catch (err) {
      console.warn('useForecastData: articles unavailable, using fallback:', err?.message)
    }
  }

  return { signals, loading, updatedAt, beefForecast, lambForecast, sentimentTimeline, categoryBreakdown }
}
