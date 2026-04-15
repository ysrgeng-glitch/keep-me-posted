/**
 * Vercel Serverless Function — Daily Briefing Generator
 * Called automatically every morning at 6:00 AM AEST (20:00 UTC) by Vercel Cron.
 * Also callable manually via GET /api/generate-briefing?force=true
 *
 * Required Vercel environment variables:
 *   VITE_SUPABASE_URL          — already set (used by the frontend)
 *   SUPABASE_SERVICE_ROLE_KEY  — add this in Vercel project settings
 *   GROQ_API_KEY               — optional; add for AI-written scripts
 */

const PODCAST_SYSTEM_PROMPT = `You are a professional broadcast journalist and commodity market analyst presenting the daily morning intelligence briefing for Grasshopper News. Your audience is JBS Southern Australia senior leadership.

CRITICAL WRITING RULES:
- Write in clear, confident, spoken English — as if speaking directly into a microphone at 6 AM
- NO bullet points, NO asterisks, NO pound signs, NO markdown of any kind
- Full flowing sentences throughout
- Every number must be spoken as words: "two point three million dollars" not "$2.3M"
- Section transitions must be spoken naturally: "Moving to our market intelligence section."
- NEVER invent facts not in the provided articles
- NEVER pad with generic filler — if a section has no relevant articles, skip it entirely
- You MUST cover ALL provided articles at least once
- ONLY include sections that have actual content from the provided articles

TARGET LENGTH — scale to the number of articles provided:
  1–3 articles  → 2–3 minutes (~250–400 words)
  4–7 articles  → 4–5 minutes (~550–700 words)
  8+ articles   → 6–8 minutes (~800–1000 words)

STRUCTURE (only include sections with actual content):
INTRO (40-60 words): "Good morning. It is [WEEKDAY], [DATE]. I am your Grasshopper News intelligence analyst." + brief summary of what is covered today.
SECTION ONE — CRITICAL ALERTS: Only if HIGH impact articles exist. What happened, which region, what JBS should do today.
SECTION TWO — MARKET INTELLIGENCE: Only if market/trade/price articles exist.
SECTION THREE — GLOBAL SIGNALS: Only if articles with international regions exist.
SECTION FOUR — DOMESTIC INDUSTRY: MEDIUM/LOW AU articles — processing, weather, biosecurity, regulation.
SECTION FIVE — STRATEGIC OUTLOOK: Only if 4+ articles exist. Biggest risk, biggest opportunity, 1-2 recommended actions.
OUTRO (20-40 words): "That concludes your Grasshopper News briefing for [DATE]. Stay informed, stay ahead."`

// ── AI-free fallback: generates a full spoken briefing from article data ───────

function buildFallbackScript(articles, dateLabel) {
  if (!articles || articles.length === 0) return null
  const high   = articles.filter(a => a.impact === 'HIGH')
  const medium = articles.filter(a => a.impact === 'MEDIUM')
  const low    = articles.filter(a => a.impact === 'LOW')
  const parts  = []

  // INTRO — scale summary to what actually exists
  const alertSummary = high.length > 0
    ? `${high.length} critical alert${high.length !== 1 ? 's' : ''} and ${medium.length + low.length} further development${medium.length + low.length !== 1 ? 's' : ''}`
    : `${articles.length} new development${articles.length !== 1 ? 's' : ''} across the Australian beef and lamb industry`
  parts.push(
    `Good morning. It is ${dateLabel}. I am your Grasshopper News intelligence analyst. ` +
    `Today's briefing covers ${alertSummary}.`
  )

  // SECTION ONE — CRITICAL ALERTS (only if there are high-impact items)
  if (high.length > 0) {
    parts.push(`Moving to critical alerts. ${high.length} high-impact development${high.length !== 1 ? 's' : ''} require your immediate attention.`)
    for (const a of high) {
      const reg = (a.regions ?? []).filter(r => r !== 'National').join(' and ') || 'national operations'
      const why = a.why_it_matters ? ` ${a.why_it_matters}` : (a.summary ? ` ${a.summary}` : '')
      const rec = a.strategic_recommendation ? ` Recommendation: ${a.strategic_recommendation}.` : ''
      const stm = a.short_term_impact ? ` Short-term: ${a.short_term_impact}.` : ''
      parts.push(`${a.headline}. This affects ${reg}.${why}${stm}${rec}`)
    }
  }

  // SECTION TWO — MARKET INTELLIGENCE (only if relevant articles exist)
  const market = articles.filter(a =>
    ['Market & Economy', 'Export / Trade', 'Forecasts / Projections', 'Production Costs'].includes(a.category)
  ).slice(0, 5)
  if (market.length > 0) {
    parts.push(`Moving to market intelligence.`)
    for (const a of market) {
      const why = a.why_it_matters ? ` ${a.why_it_matters}` : ''
      const med = a.medium_term_impact ? ` Looking ahead: ${a.medium_term_impact}.` : ''
      parts.push(`${a.headline}.${why}${med}`)
    }
  }

  // SECTION THREE — GLOBAL SIGNALS (only if international articles exist)
  const global = articles.filter(a =>
    (a.regions ?? []).some(r => ['Global', 'USA', 'China', 'International', 'NZ', 'EU', 'Brazil'].includes(r))
  ).slice(0, 4)
  if (global.length > 0) {
    parts.push(`Moving to global signals.`)
    for (const a of global) {
      const why = a.why_it_matters ? ` ${a.why_it_matters}` : ''
      parts.push(`${a.headline}.${why}`)
    }
  }

  // SECTION FOUR — DOMESTIC INDUSTRY (only if domestic medium/low articles exist)
  const domestic = [...medium, ...low]
    .filter(a => !(a.regions ?? []).some(r => ['Global', 'USA', 'China', 'Brazil', 'EU'].includes(r)))
    .slice(0, 6)
  if (domestic.length > 0) {
    parts.push(`Moving to domestic industry news.`)
    for (const a of domestic) {
      const why = a.why_it_matters ? ` ${a.why_it_matters}` : (a.summary ? ` ${a.summary}` : '')
      const stm = a.short_term_impact ? ` Short-term outlook: ${a.short_term_impact}.` : ''
      parts.push(`${a.headline}.${why}${stm}`)
    }
  }

  // SECTION FIVE — STRATEGIC OUTLOOK (only if enough articles to warrant it)
  if (articles.length >= 4) {
    const topRisk = high[0] ?? medium[0]
    const topOpp  = medium.find(a => (a.sentiment ?? 0) > 0) ?? medium[0]
    parts.push(`Finally, our strategic outlook.`)
    if (topRisk) parts.push(`The biggest risk today: ${topRisk.headline.toLowerCase()}. ${topRisk.strategic_recommendation ?? ''}`)
    if (topOpp && topOpp !== topRisk) parts.push(`The primary opportunity: ${topOpp.headline.toLowerCase()}. ${topOpp.strategic_recommendation ?? ''}`)
  }

  parts.push(`That concludes your Grasshopper News briefing for ${dateLabel}. Stay informed, stay ahead.`)

  return parts.filter(Boolean).join(' ')
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Allow GET (manual trigger) and POST (cron trigger)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseUrl     = process.env.VITE_SUPABASE_URL
  const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  const groqApiKey      = process.env.GROQ_API_KEY ?? ''

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured in Vercel environment variables' })
  }

  const force = req.query?.force === 'true'
  const today = new Date().toISOString().split('T')[0]
  const dateLabel = new Date().toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const headers = {
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  }

  // ── 1. Idempotency check ────────────────────────────────────────────────────
  if (!force) {
    const checkRes = await fetch(
      `${supabaseUrl}/rest/v1/daily_briefings?briefing_date=eq.${today}&select=id,briefing_text`,
      { headers }
    )
    const existing = await checkRes.json()
    if (Array.isArray(existing) && existing.length > 0) {
      const wc = (existing[0].briefing_text ?? '').split(/\s+/).filter(Boolean).length
      if (wc >= 200) {
        return res.status(200).json({ ok: true, message: 'Briefing already exists', date: today, word_count: wc })
      }
    }
  }

  // ── 2. Delete today's briefing if force=true ────────────────────────────────
  if (force) {
    await fetch(
      `${supabaseUrl}/rest/v1/daily_briefings?briefing_date=eq.${today}`,
      { method: 'DELETE', headers }
    )
  }

  // ── 3. Fetch articles (last 24 hours only) ─────────────────────────────────
  const COLS = 'id,headline,summary,why_it_matters,category,impact,regions,source,published_at,short_term_impact,medium_term_impact,strategic_recommendation,financial_impact_label,financial_impact_high_aud,sentiment'

  // Strict 24-hour window — briefing covers today's news only.
  // If nothing is new in the last 24 hours, the briefing will say so.
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const r24 = await fetch(
    `${supabaseUrl}/rest/v1/articles?select=${COLS}&created_at=gte.${cutoff24h}&order=confidence_score.desc&limit=50`,
    { headers }
  )
  const data24 = await r24.json()
  const rawArticles = Array.isArray(data24) ? data24 : []

  // Deduplicate: same story published by multiple sources → keep highest confidence_score
  // Uses a simple headline fingerprint (lowercased, punctuation stripped, stop words removed)
  const STOP = new Set(['the','a','an','in','on','at','of','to','and','or','for','with','by','as',
    'is','are','was','were','be','been','has','have','had','will','would','could','its','it',
    'this','that','from','up','out','new','say','says','said'])
  function fingerprint(headline) {
    return (headline ?? '').toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter(w => w.length > 1 && !STOP.has(w)).join(' ').slice(0, 80)
  }
  const seen = new Set()
  const articles = rawArticles.filter(a => {
    const fp = fingerprint(a.headline)
    if (seen.has(fp)) return false
    seen.add(fp)
    return true
  })

  // Sort: HIGH first, then MEDIUM, then LOW, newest first within each group
  const ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 }
  articles.sort((a, b) => {
    const d = (ORDER[a.impact] ?? 2) - (ORDER[b.impact] ?? 2)
    return d !== 0 ? d : new Date(b.published_at) - new Date(a.published_at)
  })

  console.log(`generate-briefing: ${rawArticles.length} raw → ${articles.length} after dedup (force=${force})`)

  // ── 4. Build briefing text ──────────────────────────────────────────────────
  // Always generate the AI-free fallback first — guaranteed real content.
  // Groq upgrades it to a polished 900-word script when available.
  let briefingText = articles.length > 0
    ? buildFallbackScript(articles, dateLabel)
    : `Good morning. It is ${dateLabel}. I am your Grasshopper News intelligence analyst. There are no new developments in the Australian beef and lamb industry in the last twenty-four hours. Monitoring continues across all major feeds. Stay informed, stay ahead.`

  if (articles.length > 0 && groqApiKey) {
    const IMPACT_ORD = { HIGH: 0, MEDIUM: 1, LOW: 2 }
    const articlesText = articles.map((a, i) => [
      `[ARTICLE ${i + 1}] IMPACT: ${a.impact} | Category: ${a.category} | Regions: ${(a.regions ?? []).join(', ')} | Source: ${a.source}`,
      `Headline: ${a.headline}`,
      `Financial Impact: ${a.financial_impact_label ?? 'not quantified'}`,
      `Summary: ${a.summary}`,
      `Why it matters: ${a.why_it_matters ?? 'N/A'}`,
      `Short-term: ${a.short_term_impact ?? 'N/A'}`,
      `Recommendation: ${a.strategic_recommendation ?? 'N/A'}`,
    ].join('\n')).join('\n\n---\n\n')

    const targetWords = articles.length <= 3 ? '250–400' : articles.length <= 7 ? '550–700' : '800–1000'
    const userPrompt = [
      `DATE: ${dateLabel}`,
      `TOTAL ARTICLES: ${articles.length}`,
      `TARGET LENGTH: ${targetWords} words — scale to the content, do not pad.`,
      `YOU MUST COVER ALL ${articles.length} ARTICLES. ONLY include sections that have relevant articles.`,
      ``,
      articlesText,
    ].join('\n')

    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          temperature: 0.4,
          max_tokens: 2000,
          messages: [
            { role: 'system', content: PODCAST_SYSTEM_PROMPT },
            { role: 'user',   content: userPrompt },
          ],
        }),
        signal: AbortSignal.timeout(90_000),
      })
      if (groqRes.ok) {
        const gData = await groqRes.json()
        const generated = (gData.choices?.[0]?.message?.content ?? '').trim()
        const wc = generated.split(/\s+/).filter(Boolean).length
        if (wc >= 200) {
          briefingText = generated
          console.log(`Groq generated ${wc} words`)
        } else {
          console.warn(`Groq too short (${wc} words) — using AI-free fallback`)
        }
      } else {
        const err = await groqRes.text()
        console.warn(`Groq failed ${groqRes.status}: ${err}`)
      }
    } catch (err) {
      console.error('Groq error:', err)
    }
  }

  // ── 5. Store in Supabase ────────────────────────────────────────────────────
  const wordCount = briefingText.split(/\s+/).filter(Boolean).length
  const upsertRes = await fetch(
    `${supabaseUrl}/rest/v1/daily_briefings`,
    {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({
        briefing_date:  today,
        briefing_text:  briefingText,
        article_ids:    articles.map(a => a.id).filter(Boolean),
        article_count:  articles.length,
        change_count:   articles.length,
      }),
    }
  )

  if (!upsertRes.ok) {
    const err = await upsertRes.text()
    return res.status(500).json({ ok: false, error: `DB write failed: ${err}` })
  }

  return res.status(200).json({
    ok: true,
    date: today,
    article_count: articles.length,
    word_count: wordCount,
    used_groq: groqApiKey.length > 0,
  })
}
