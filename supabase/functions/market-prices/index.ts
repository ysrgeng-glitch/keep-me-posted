/**
 * Grasshopper News — Market Prices Fetcher
 * Supabase Edge Function (Deno runtime)
 *
 * Fetches:
 *   1. AUD/USD exchange rate from open.er-api.com (free, reliable)
 *   2. MLA EYCI beef indicator from MLA's public data (best-effort)
 *   3. SA lamb/beef indicative prices from MLA feeds (best-effort)
 *
 * Stores results in the market_prices table.
 * Scheduled: 0 8,12,16 * * 1-5 (3x weekdays via pg_cron)
 *
 * Required Supabase table:
 *   CREATE TABLE market_prices (
 *     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *     fetched_at timestamptz DEFAULT now(),
 *     commodity text CHECK (commodity IN ('lamb','beef','currency','eyci')),
 *     price_per_kg_aud numeric,
 *     exchange_rate numeric,
 *     saleyard text,
 *     price_type text,
 *     direction text CHECK (direction IN ('up','down','flat')),
 *     source_url text
 *   );
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SB_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const results: any[] = []
  const errors: string[] = []

  // ── 1. AUD/USD from open.er-api.com (free, no auth, CORS-enabled) ───────────
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(8_000),
    })
    if (res.ok) {
      const data = await res.json()
      const audRate = data?.rates?.AUD
      if (audRate && typeof audRate === 'number') {
        // AUD per USD → convert to USD per AUD (e.g. 0.6423)
        const usdPerAud = Number((1 / audRate).toFixed(4))

        // Fetch yesterday's rate to determine direction
        const { data: yesterday } = await supabase
          .from('market_prices')
          .select('exchange_rate')
          .eq('commodity', 'currency')
          .order('fetched_at', { ascending: false })
          .limit(1)
          .single()

        const prevRate = yesterday?.exchange_rate ?? usdPerAud
        const direction = usdPerAud > prevRate + 0.001 ? 'up' : usdPerAud < prevRate - 0.001 ? 'down' : 'flat'

        results.push({
          commodity: 'currency',
          exchange_rate: usdPerAud,
          price_per_kg_aud: null,
          saleyard: null,
          price_type: 'spot',
          direction,
          source_url: 'https://open.er-api.com',
        })
        console.log(`AUD/USD: ${usdPerAud} (${direction})`)
      }
    }
  } catch (err) {
    errors.push(`AUD/USD fetch failed: ${err}`)
    console.warn('AUD/USD fetch failed:', err)
  }

  // ── 2. MLA EYCI Beef Indicator (public MLA data) ─────────────────────────────
  // MLA provides indicator data via their prices page — attempt HTML parse
  try {
    const mlaRes = await fetch(
      'https://www.mla.com.au/prices-and-markets/cattle-and-beef/cattle/eyci/',
      {
        headers: {
          'User-Agent': 'GrasshopperNews-PriceFetcher/1.0 (price data aggregator)',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(10_000),
      }
    )
    if (mlaRes.ok) {
      const html = await mlaRes.text()
      // Look for EYCI price pattern like "XXX.XX" in context of EYCI
      // MLA pages typically show prices like "756.34c/kg cwt"
      const eycMatch = html.match(/EYCI[^0-9]*?(\d{3,4}(?:\.\d{1,2})?)\s*(?:c\/kg|¢\/kg)/i)
      if (eycMatch) {
        const eyciCentsPerKg = parseFloat(eycMatch[1])
        const eyciPerKg = Number((eyciCentsPerKg / 100).toFixed(4)) // convert cents to dollars

        const { data: prevEyci } = await supabase
          .from('market_prices')
          .select('price_per_kg_aud')
          .eq('commodity', 'eyci')
          .order('fetched_at', { ascending: false })
          .limit(1)
          .single()

        const prevPrice = prevEyci?.price_per_kg_aud ?? eyciPerKg
        const direction = eyciPerKg > prevPrice + 0.005 ? 'up' : eyciPerKg < prevPrice - 0.005 ? 'down' : 'flat'

        results.push({
          commodity: 'eyci',
          price_per_kg_aud: eyciPerKg,
          exchange_rate: null,
          saleyard: 'Eastern Young Cattle Indicator',
          price_type: 'indicator',
          direction,
          source_url: 'https://www.mla.com.au/prices-and-markets/cattle-and-beef/cattle/eyci/',
        })
        console.log(`EYCI: ${eyciPerKg} AUD/kg cwt (${direction})`)
      } else {
        console.log('EYCI: price pattern not found in MLA HTML')
      }
    }
  } catch (err) {
    errors.push(`MLA EYCI fetch failed: ${err}`)
    console.warn('MLA EYCI fetch failed:', err)
  }

  // ── 3. SA Lamb indicator (MLA lamb prices page) ──────────────────────────────
  try {
    const lambRes = await fetch(
      'https://www.mla.com.au/prices-and-markets/sheep-and-lamb/lamb/',
      {
        headers: {
          'User-Agent': 'GrasshopperNews-PriceFetcher/1.0',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(10_000),
      }
    )
    if (lambRes.ok) {
      const html = await lambRes.text()
      // Look for trade lamb or SA price patterns
      const lambMatch = html.match(/(\d{3,4}(?:\.\d{1,2})?)\s*(?:c\/kg|¢\/kg)/i)
      if (lambMatch) {
        const lambCentsPerKg = parseFloat(lambMatch[1])
        const lambPerKg = Number((lambCentsPerKg / 100).toFixed(4))

        const { data: prevLamb } = await supabase
          .from('market_prices')
          .select('price_per_kg_aud')
          .eq('commodity', 'lamb')
          .order('fetched_at', { ascending: false })
          .limit(1)
          .single()

        const prevPrice = prevLamb?.price_per_kg_aud ?? lambPerKg
        const direction = lambPerKg > prevPrice + 0.005 ? 'up' : lambPerKg < prevPrice - 0.005 ? 'down' : 'flat'

        results.push({
          commodity: 'lamb',
          price_per_kg_aud: lambPerKg,
          exchange_rate: null,
          saleyard: 'National Trade Lamb',
          price_type: 'indicator',
          direction,
          source_url: 'https://www.mla.com.au/prices-and-markets/sheep-and-lamb/lamb/',
        })
        console.log(`Lamb: ${lambPerKg} AUD/kg cwt (${direction})`)
      } else {
        console.log('Lamb: price pattern not found in MLA HTML (page may require JS)')
      }
    }
  } catch (err) {
    errors.push(`MLA Lamb fetch failed: ${err}`)
    console.warn('MLA Lamb fetch failed:', err)
  }

  // ── 4. Store results ──────────────────────────────────────────────────────────
  if (results.length > 0) {
    const { error: insertError } = await supabase
      .from('market_prices')
      .insert(results)

    if (insertError) {
      console.warn('market_prices insert failed (table may not exist yet):', insertError.message)
    } else {
      console.log(`Stored ${results.length} price records`)
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      stored: results.length,
      errors,
      prices: results,
    }),
    { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
  )
})
