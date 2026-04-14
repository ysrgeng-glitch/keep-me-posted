/**
 * Vercel Serverless Function — Live Market Prices
 * GET /api/market-prices
 *
 * 1. AUD/USD — fetched live from open.er-api.com
 * 2. Livestock prices — scraped from MLA weekly market wrap (plain HTML article)
 *    Falls back to last known verified values (MLA April 2026 data) if fetch fails.
 *
 * Response is CDN-cached for 1 hour, stale-while-revalidate for 2 hours.
 */

const MLA_WRAP_BASE =
  'https://www.mla.com.au/news-and-events/industry-news/'

// Build candidate wrap URLs: try every day going back 14 days
// MLA publishes the weekly wrap on Thursdays or Fridays
function getCandidateWrapUrls() {
  const urls = []
  const now = new Date()
  for (let i = 0; i < 14; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dd   = String(d.getDate()).padStart(2, '0')
    const mm   = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    urls.push(`${MLA_WRAP_BASE}${dd}${mm}${yyyy}weekly-cattle-and-sheep-market-wrap/`)
  }
  return urls
}

// Extract prices from the article HTML using regex on plain text
function parsePricesFromHtml(html) {
  // Strip tags to get article text
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ')

  const find = (pattern) => {
    const m = text.match(pattern)
    return m ? parseFloat(m[1].replace(/,/g, '')) : null
  }

  // Lamb — prefer Trade Lamb, fall back to Light Lamb
  const tradeLamb  = find(/Trade\s+Lamb\s+Indicator[^0-9]{0,60}([0-9][0-9,]+\.?[0-9]*)\s*[¢c]\/kg/i)
  const lightLamb  = find(/Light\s+Lamb\s+Indicator[^0-9]{0,60}([0-9][0-9,]+\.?[0-9]*)\s*[¢c]\/kg/i)
  const heavyLamb  = find(/Heavy\s+Lamb\s+Indicator[^0-9]{0,60}([0-9][0-9,]+\.?[0-9]*)\s*[¢c]\/kg/i)

  // Beef — prefer EYCI, fall back to Feeder Steer
  const eyci        = find(/EYCI[^0-9]{0,40}([0-9]+\.?[0-9]*)\s*[¢c]\/kg/i)
  const feederSteer = find(/Feeder\s+Steer\s+Indicator[^0-9]{0,60}([0-9]+\.?[0-9]*)\s*[¢c]\/kg/i)
  const feederHeifer= find(/Feeder\s+Heifer\s+Indicator[^0-9]{0,60}([0-9]+\.?[0-9]*)\s*[¢c]\/kg/i)

  const mutton = find(/Mutton\s+Indicator[^0-9]{0,60}([0-9][0-9,]+\.?[0-9]*)\s*[¢c]\/kg/i)

  return {
    lamb:  tradeLamb ?? lightLamb ?? heavyLamb ?? null,
    lambName: tradeLamb ? 'Trade Lamb' : lightLamb ? 'Light Lamb' : 'Heavy Lamb',
    beef:  eyci ?? feederSteer ?? feederHeifer ?? null,
    beefName: eyci ? 'EYCI' : feederSteer ? 'Feeder Steer' : 'Feeder Heifer',
    mutton,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Cache on Vercel Edge for 1 hour; serve stale for up to 2 hours
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
  res.setHeader('Access-Control-Allow-Origin', '*')

  const result = {
    audusd:   null,
    lamb:     null,
    beef:     null,
    source:   'fallback',
    sourceUrl: null,
    updatedAt: new Date().toISOString(),
  }

  // ── 1. AUD/USD live ──────────────────────────────────────────────────────────
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(8_000),
    })
    if (r.ok) {
      const d = await r.json()
      if (d?.rates?.AUD) {
        const rate = 1 / d.rates.AUD
        result.audusd = {
          value: parseFloat(rate.toFixed(4)),
          label: rate.toFixed(4),
          unit:  'USD',
          source: 'open.er-api.com',
        }
      }
    }
  } catch (e) {
    console.warn('AUD/USD fetch failed:', e.message)
  }

  // ── 2. MLA livestock prices ──────────────────────────────────────────────────
  for (const url of getCandidateWrapUrls()) {
    try {
      const r = await fetch(url, {
        signal: AbortSignal.timeout(12_000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GrasshopperNews/1.0; +https://keep-me-posted-gilt.vercel.app)',
          'Accept': 'text/html',
        },
      })
      if (!r.ok) continue

      const html = await r.text()
      const parsed = parsePricesFromHtml(html)

      if (parsed.lamb || parsed.beef) {
        if (parsed.lamb) {
          result.lamb = {
            value:  parsed.lamb,
            label:  `$${(parsed.lamb / 100).toFixed(2)}/kg`,
            unit:   'cwt',
            name:   parsed.lambName,
            source: 'MLA',
          }
        }
        if (parsed.beef) {
          result.beef = {
            value:  parsed.beef,
            label:  `$${(parsed.beef / 100).toFixed(2)}/kg`,
            unit:   'lw',
            name:   parsed.beefName,
            source: 'MLA',
          }
        }
        result.source    = 'mla'
        result.sourceUrl = url
        console.log(`market-prices: parsed from ${url} — lamb=${parsed.lamb} beef=${parsed.beef}`)
        break
      }
    } catch (e) {
      // Try next candidate date
      continue
    }
  }

  // ── 3. Fallback — last verified MLA values (April 10, 2026) ─────────────────
  if (!result.lamb) {
    result.lamb = {
      value:  1193,
      label:  '$11.93/kg',
      unit:   'cwt',
      name:   'Light Lamb Indicator',
      source: 'MLA (last known)',
      isFallback: true,
    }
  }
  if (!result.beef) {
    result.beef = {
      value:  456,
      label:  '$4.56/kg',
      unit:   'lw',
      name:   'Feeder Steer',
      source: 'MLA (last known)',
      isFallback: true,
    }
  }

  return res.status(200).json(result)
}
