// ====================================================
// Grasshopper News — useForecastData Hook
//
// Live Market Indicators: fetched from /api/market-prices (Vercel function),
// which scrapes the MLA weekly cattle & sheep market wrap.
//
// Price Forecast Charts: historical values anchored to MLA published data
// (April 2026). Forward projections are model estimates based on seasonal
// patterns and current supply-demand signals — indicative only.
// ====================================================

import { useState, useEffect } from 'react'

// ── Static forecast chart data ───────────────────────────────────────────────
// Historical values (Oct 2025 – Mar 2026) sourced from MLA published indicators.
// Apr 2026 onward = AI model projection with confidence band.
// Units: AUD $/kg cwt for lamb; AUD $/kg liveweight for beef/EYCI.

export const BEEF_FORECAST = [
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

export const LAMB_FORECAST = [
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

// ── Static fallback signals (MLA April 10, 2026 + ABS/ABARES) ────────────────
const FALLBACK_SIGNALS = [
  { label: 'Lamb',         value: '$11.93/kg', direction: 'up',   note: 'Light Lamb Indicator (cwt) · MLA' },
  { label: 'Mutton',       value: '$8.14/kg',  direction: 'up',   note: 'Mutton Indicator (cwt) · MLA' },
  { label: 'AUD/USD',      value: '—',         direction: 'up',   note: 'Live exchange rate' },
  { label: 'Feed Wheat',   value: '$310/t',    direction: 'up',   note: 'East coast spot · ABARES indicative' },
  { label: 'Feeder Steer', value: '$4.56/kg',  direction: 'down', note: 'Feeder Steer Indicator (lw) · MLA' },
  { label: 'Export Beef',  value: '+4.2%',     direction: 'up',   note: 'YoY volume vs prior year · MLA' },
]

export function useForecastData() {
  const [signals, setSignals]   = useState(FALLBACK_SIGNALS)
  const [loading, setLoading]   = useState(true)
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => {
    fetchSignals()
    const interval = setInterval(fetchSignals, 60 * 60 * 1000) // refresh every hour
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchSignals() {
    setLoading(true)
    try {
      const res = await fetch('/api/market-prices', {
        signal: AbortSignal.timeout(15_000),
      })
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
      setUpdatedAt(new Date())
    } catch (err) {
      console.warn('useForecastData: API unavailable, using fallback:', err?.message)
      setSignals(FALLBACK_SIGNALS)
      setUpdatedAt(new Date())
    }
    setLoading(false)
  }

  return { signals, loading, updatedAt, beefForecast: BEEF_FORECAST, lambForecast: LAMB_FORECAST }
}
