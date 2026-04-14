// ====================================================
// Grasshopper News — useMarketPrices Hook
// Fetches live prices from /api/market-prices (Vercel function):
//   - AUD/USD via open.er-api.com
//   - Lamb & Beef via MLA weekly market wrap (scraped server-side)
//   Falls back to last-known MLA values when the function is unavailable
//   (e.g. local dev without Vercel CLI).
// ====================================================

import { useState, useEffect } from 'react'

// Last verified values from MLA weekly wrap — April 10, 2026
const STATIC_FALLBACK = {
  lamb: {
    value: 1193,
    label: '$11.93/kg',
    unit: 'cwt',
    saleyard: 'Light Lamb Indicator (MLA)',
    direction: null,
  },
  beef: {
    value: 456,
    label: '$4.56/kg',
    unit: 'lw',
    saleyard: 'Feeder Steer Indicator (MLA)',
    direction: null,
  },
  eyci: null,
  audusd: null,
}

export function useMarketPrices() {
  const [prices, setPrices]   = useState({ audusd: null, lamb: null, beef: null, eyci: null })
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => {
    fetchAll()
    // Refresh every hour
    const interval = setInterval(fetchAll, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchAll() {
    setLoading(true)

    try {
      const res = await fetch('/api/market-prices', {
        signal: AbortSignal.timeout(15_000),
      })

      if (res.ok) {
        const data = await res.json()

        setPrices({
          audusd: data.audusd
            ? {
                value:     data.audusd.value,
                label:     String(data.audusd.label),
                direction: data.audusd.direction ?? null,
              }
            : null,

          lamb: data.lamb
            ? {
                value:     data.lamb.value,
                label:     data.lamb.label,
                direction: null,
                saleyard:  `${data.lamb.name} (${data.lamb.unit === 'cwt' ? 'carcase wt' : 'live wt'})`,
              }
            : STATIC_FALLBACK.lamb,

          beef: data.beef
            ? {
                value:     data.beef.value,
                label:     data.beef.label,
                direction: null,
                saleyard:  `${data.beef.name} (${data.beef.unit === 'cwt' ? 'carcase wt' : 'live wt'})`,
              }
            : STATIC_FALLBACK.beef,

          eyci: null,
        })

        setUpdatedAt(new Date())
        setLoading(false)
        return
      }
    } catch (err) {
      // /api/market-prices unavailable (local dev) — use fallback below
      console.warn('market-prices API unavailable:', err?.message)
    }

    // ── Fallback: static last-known MLA values + live AUD/USD ────────────────
    const fallback = { ...STATIC_FALLBACK }

    try {
      const r = await fetch('https://open.er-api.com/v6/latest/USD', {
        signal: AbortSignal.timeout(8_000),
      })
      if (r.ok) {
        const d = await r.json()
        if (d?.rates?.AUD) {
          const rate = 1 / d.rates.AUD
          fallback.audusd = {
            value:     parseFloat(rate.toFixed(4)),
            label:     rate.toFixed(4),
            direction: null,
          }
        }
      }
    } catch (e) {
      console.warn('AUD/USD fallback fetch failed:', e?.message)
    }

    setPrices(fallback)
    setUpdatedAt(new Date())
    setLoading(false)
  }

  return { prices, loading, updatedAt, refresh: fetchAll }
}
