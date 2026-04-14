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
- You MUST use ALL provided articles
- TARGET: MINIMUM 900 words. Do NOT stop before 900 words.

STRUCTURE:
INTRO (60-80 words): "Good morning. It is [WEEKDAY], [DATE]. I am your Grasshopper News intelligence analyst. Here is your complete briefing for the Australian Beef and Lamb industry." + one sentence on market mood.
SECTION ONE — CRITICAL ALERTS (~150 words): All HIGH impact articles — what happened, which region, what JBS should do today.
SECTION TWO — MARKET INTELLIGENCE (~200 words): AUD/USD, EYCI, SA lamb/beef prices, freight costs, margin interpretation.
SECTION THREE — GLOBAL SIGNALS (~150 words): US/China trade, FMD outbreaks, shipping disruptions, competitor supply changes.
SECTION FOUR — DOMESTIC INDUSTRY (~200 words): MEDIUM/LOW AU stories — processing, weather, biosecurity, regulation, MLA/ABARES.
SECTION FIVE — STRATEGIC OUTLOOK (~150 words): Biggest risk, biggest opportunity, 2-3 recommended actions referencing specific stories.
OUTRO (40-60 words): "That concludes your Grasshopper News briefing for [DATE]. Next update tomorrow morning at six AM. Stay informed, stay ahead."`

// ── AI-free fallback: generates a full spoken briefing from article data ───────

function buildFallbackScript(articles, dateLabel) {
  if (!articles || articles.length === 0) return null
  const high   = articles.filter(a => a.impact === 'HIGH')
  const medium = articles.filter(a => a.impact === 'MEDIUM')
  const low    = articles.filter(a => a.impact === 'LOW')
  const parts  = []

  parts.push(
    `Good morning. It is ${dateLabel}. I am your Grasshopper News intelligence analyst. ` +
    `Here is your complete intelligence briefing for the Australian Beef and Lamb industry. ` +
    `We are tracking ${articles.length} intelligence items today — ` +
    `${high.length} critical alert${high.length !== 1 ? 's' : ''}, ` +
    `${medium.length} medium-impact development${medium.length !== 1 ? 's' : ''}, ` +
    `and ${low.length} lower-priority item${low.length !== 1 ? 's' : ''}.`
  )

  if (high.length > 0) {
    parts.push(`Moving to our critical alerts section. We have ${high.length} high-impact development${high.length !== 1 ? 's' : ''} requiring immediate attention.`)
    for (const a of high) {
      const reg = (a.regions ?? []).filter(r => r !== 'National').join(' and ') || 'national operations'
      const fin = a.financial_impact_label ? ` Financial exposure: ${a.financial_impact_label}.` : ''
      const why = a.why_it_matters ? ` ${a.why_it_matters}` : (a.summary ? ` ${a.summary}` : '')
      const rec = a.strategic_recommendation ? ` Recommendation: ${a.strategic_recommendation}.` : ''
      const stm = a.short_term_impact ? ` Short-term: ${a.short_term_impact}.` : ''
      parts.push(`${a.headline}. This affects ${reg}.${why}${stm}${fin}${rec}`)
    }
  } else {
    parts.push(`There are no critical high-impact alerts at this time. Moving to market intelligence.`)
  }

  parts.push(`Moving to our market intelligence section.`)
  const market = articles.filter(a =>
    ['Market & Economy', 'Export / Trade', 'Forecasts / Projections', 'Production Costs'].includes(a.category)
  ).slice(0, 5)
  for (const a of market) {
    const why = a.why_it_matters ? ` ${a.why_it_matters}` : ''
    const med = a.medium_term_impact ? ` Looking ahead: ${a.medium_term_impact}.` : ''
    parts.push(`${a.headline}.${why}${med}`)
  }
  if (market.length === 0) parts.push(`No specific market price data is available in today's feed. Monitoring continues.`)

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

  const topRisk = high[0] ?? medium[0]
  const topOpp  = medium.find(a => (a.sentiment ?? 0) > 0) ?? medium[0]
  parts.push(`Moving to our strategic outlook.`)
  if (topRisk) parts.push(`The single biggest risk this week: ${topRisk.headline.toLowerCase()}. ${topRisk.strategic_recommendation ?? ''}`)
  if (topOpp && topOpp !== topRisk) parts.push(`The primary opportunity: ${topOpp.headline.toLowerCase()}. ${topOpp.strategic_recommendation ?? ''}`)
  parts.push(`The operations and commercial teams should review today's high-impact items immediately and ensure procurement and biosecurity protocols are current.`)
  parts.push(`That concludes your Grasshopper News briefing for ${dateLabel}. Next update tomorrow morning at six AM. Stay informed, stay ahead.`)

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

  // ── 3. Fetch articles (36 h → 7 day fallback) ──────────────────────────────
  const COLS = 'id,headline,summary,why_it_matters,category,impact,regions,source,published_at,short_term_impact,medium_term_impact,strategic_recommendation,financial_impact_label,financial_impact_high_aud,sentiment'

  let articles = []
  const cutoff36h = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
  const r36 = await fetch(
    `${supabaseUrl}/rest/v1/articles?select=${COLS}&created_at=gte.${cutoff36h}&order=confidence_score.desc&limit=25`,
    { headers }
  )
  const data36 = await r36.json()
  if (Array.isArray(data36) && data36.length > 0) {
    articles = data36
  } else {
    const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const r7d = await fetch(
      `${supabaseUrl}/rest/v1/articles?select=${COLS}&created_at=gte.${cutoff7d}&order=confidence_score.desc&limit=25`,
      { headers }
    )
    const data7d = await r7d.json()
    articles = Array.isArray(data7d) ? data7d : []
  }

  // Sort: HIGH first, then MEDIUM, then LOW
  const ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 }
  articles.sort((a, b) => {
    const d = (ORDER[a.impact] ?? 2) - (ORDER[b.impact] ?? 2)
    return d !== 0 ? d : new Date(b.published_at) - new Date(a.published_at)
  })

  console.log(`generate-briefing: ${articles.length} articles (force=${force})`)

  // ── 4. Build briefing text ──────────────────────────────────────────────────
  // Always generate the AI-free fallback first — guaranteed real content.
  // Groq upgrades it to a polished 900-word script when available.
  let briefingText = articles.length > 0
    ? buildFallbackScript(articles, dateLabel)
    : `Good morning. It is ${dateLabel}. I am your Grasshopper News intelligence analyst. No new intelligence has been recorded in the last thirty-six hours. Monitoring continues. Stay informed, stay ahead.`

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

    const userPrompt = [
      `DATE: ${dateLabel}`,
      `TOTAL ARTICLES: ${articles.length}`,
      `YOU MUST USE ALL ${articles.length} ARTICLES. DO NOT STOP BEFORE 900 WORDS.`,
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
