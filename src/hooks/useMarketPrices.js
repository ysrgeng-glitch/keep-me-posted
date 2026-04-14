// ====================================================
// Grasshopper News — useMarketPrices Hook
// Fetches live AUD/USD directly from the browser (CORS-ok)
// and reads commodity prices from Supabase market_prices table.
// ====================================================

import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export function useMarketPrices() {
  const [prices, setPrices]   = useState({ audusd: null, lamb: null, beef: null, eyci: null })
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => {
    fetchAll()
    // Refresh every 30 minutes
    const interval = setInterval(fetchAll, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchAll() {
    setLoading(true)
    const result = { audusd: null, lamb: null, beef: null, eyci: null }

    // ── 1. AUD/USD — fetch directly from browser ──────────────────────────────
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD', {
        signal: AbortSignal.timeout(8_000),
      })
      if (res.ok) {
        const data = await res.json()
        const audRate = data?.rates?.AUD
        if (audRate) {
          result.audusd = {
            value: Number((1 / audRate).toFixed(4)),
            direction: null, // can't determine direction without history on client
            label: `${(1 / audRate).toFixed(4)}`,
          }
        }
      }
    } catch (err) {
      console.warn('AUD/USD fetch failed:', err)
    }

    // ── 2. Commodity prices from Supabase market_prices table ─────────────────
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('market_prices')
          .select('commodity, price_per_kg_aud, exchange_rate, saleyard, direction, fetched_at')
          .in('commodity', ['lamb', 'beef', 'eyci', 'currency'])
          .order('fetched_at', { ascending: false })
          .limit(20)

        if (data && data.length > 0) {
          // Take the most recent record for each commodity
          const byType = {}
          for (const row of data) {
            if (!byType[row.commodity]) byType[row.commodity] = row
          }

          if (byType.lamb) {
            result.lamb = {
              value: byType.lamb.price_per_kg_aud,
              direction: byType.lamb.direction,
              saleyard: byType.lamb.saleyard,
              label: byType.lamb.price_per_kg_aud
                ? `$${Number(byType.lamb.price_per_kg_aud).toFixed(2)}/kg`
                : null,
            }
          }

          if (byType.beef || byType.eyci) {
            const row = byType.beef ?? byType.eyci
            result.beef = {
              value: row.price_per_kg_aud,
              direction: row.direction,
              saleyard: row.saleyard,
              label: row.price_per_kg_aud
                ? `$${Number(row.price_per_kg_aud).toFixed(2)}/kg cwt`
                : null,
            }
          }

          if (byType.eyci) {
            result.eyci = {
              value: byType.eyci.price_per_kg_aud,
              direction: byType.eyci.direction,
              saleyard: byType.eyci.saleyard,
              label: byType.eyci.price_per_kg_aud
                ? `$${Number(byType.eyci.price_per_kg_aud).toFixed(2)}/kg`
                : null,
            }
          }

          // If currency is also stored, prefer DB direction info
          if (byType.currency && byType.currency.exchange_rate) {
            result.audusd = {
              value: byType.currency.exchange_rate,
              direction: byType.currency.direction,
              label: `${Number(byType.currency.exchange_rate).toFixed(4)}`,
            }
          }
        }
      } catch (err) {
        // Silently fail — table may not exist yet
        console.warn('market_prices table read failed (may not exist yet):', err?.message)
      }
    }

    setPrices(result)
    setUpdatedAt(new Date())
    setLoading(false)
  }

  return { prices, loading, updatedAt, refresh: fetchAll }
}
