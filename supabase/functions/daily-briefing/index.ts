/**
 * Grasshopper News — Daily Intelligence Podcast Generator
 * Supabase Edge Function (Deno runtime)
 *
 * Generates a structured 6–8 minute podcast script from the last 36 hours
 * of articles (all impact levels), weighted toward HIGH/MEDIUM.
 * Scheduled: 6 AM AEST weekdays (20:00 UTC Mon–Fri via pg_cron)
 *
 * Script is stored in daily_briefings table and played via browser Web Speech API.
 * Target: ~900–1,100 words ≈ 7–8 minutes at 120–130 wpm natural pace.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// ── Podcast script system prompt ──────────────────────────────────────────────

const PODCAST_SYSTEM_PROMPT = `You are a professional broadcast journalist and commodity market analyst presenting the daily morning intelligence briefing for Grasshopper News. Your audience is JBS Southern Australia senior leadership — one of Australia's largest beef and lamb processors.

CRITICAL WRITING RULES:
- Write in clear, confident, spoken English — as if speaking directly into a microphone at 6 AM
- NO bullet points, NO asterisks, NO pound signs, NO markdown of any kind
- Full flowing sentences throughout — no abbreviations that would sound odd when read aloud
- Every number must be spoken as words: write "two point three million dollars" not "$2.3M", write "ninety-four US cents to the dollar" not "0.94", write "six percent" not "6%"
- Section transitions must be spoken naturally: say "Moving to our market intelligence section." not "## SECTION 2"
- NEVER invent facts not present in the provided articles. If a price is not in the articles, say you don't have it.
- You MUST use ALL provided articles. Do not skip any article — weave every story into the appropriate section of the script.
- TARGET LENGTH: You MUST write a MINIMUM of 900 words and a MAXIMUM of 1,100 words. Count every word. Do NOT stop before 900 words. If you reach the Outro before 900 words, go back and expand each section with more analysis, context, and implications for JBS. A 900-word script at natural speaking pace takes approximately seven to eight minutes.
- Do NOT finish early. Do NOT summarise briefly. Write in full sentences until you reach at least 900 words.

EXACT STRUCTURE TO FOLLOW:

INTRO (60–80 words)
Open with: "Good morning. It is [WEEKDAY], [DATE]. I am your Grasshopper News intelligence analyst. Here is your complete briefing for the Australian Beef and Lamb industry."
Follow with one sentence summarising market mood and how many significant developments are in this briefing — for example: "Markets are cautious today with two high-impact stories demanding your immediate attention."

SECTION ONE — CRITICAL ALERTS (approximately 150 words)
Cover ALL HIGH impact articles. For each story: state what happened, which operation or region is affected — South Australia, Victoria, New South Wales, or Tasmania — and what action JBS leadership should consider TODAY. Be direct: state "This directly affects JBS because..." for each alert.
If there are no HIGH impact stories, say so in one sentence and transition to the next section.

SECTION TWO — MARKET INTELLIGENCE (approximately 200 words)
Cover current market conditions from the provided articles. State the current AUD to USD exchange rate and trend direction if available. State the current MLA EYCI beef indicator if available. Cover South Australia lamb price per kilogram and beef price per kilogram — saleyard and over-the-hooks — if mentioned in any article. Cover any shipping or freight cost movements. Provide a brief interpretation of what current conditions mean for JBS margins this week. If a specific price is not available in the provided articles, acknowledge it briefly and move on.

SECTION THREE — GLOBAL SIGNALS (approximately 150 words)
Cover international stories that affect Australian beef and lamb: United States or China trade tensions, foot and mouth disease outbreaks anywhere in the world, Middle East or European conflicts affecting shipping lanes or fuel costs, competitor country production changes from the United States, Brazil, Argentina, New Zealand, or the European Union, any currency drivers for the Australian dollar, and any import or export tariff changes affecting access to key markets.

SECTION FOUR — DOMESTIC INDUSTRY NEWS (approximately 200 words)
Cover MEDIUM and LOW impact Australian stories: processing capacity and throughput, supply chain disruptions, weather events affecting grazing conditions, biosecurity announcements, regulation changes including live export rules and ESCAS, labour market developments, MLA or ABARES announcements, retail demand shifts, and supermarket pricing pressure on beef and lamb.

SECTION FIVE — STRATEGIC OUTLOOK (approximately 150 words)
Synthesise the above into a forward-looking view. State the single biggest risk for JBS Southern Australia this week. State the single biggest opportunity. Provide two or three specific recommended actions for the operations or commercial team, each referencing a specific story from this briefing.

OUTRO (40–60 words)
Close with: "That concludes your Grasshopper News briefing for [DATE]. Next update tomorrow morning at six AM. Stay informed, stay ahead."`

// ── AI-free fallback script builder ──────────────────────────────────────────
// Used when Groq is unavailable or returns a short response.
// Generates a full spoken briefing directly from article data — always produces
// enough content for a real audio session (target: 400–600 words).

function buildFallbackScript(articles: any[], dateLabel: string): string {
  const high   = articles.filter((a: any) => a.impact === 'HIGH')
  const medium = articles.filter((a: any) => a.impact === 'MEDIUM')
  const low    = articles.filter((a: any) => a.impact === 'LOW')
  const parts: string[] = []

  // INTRO
  parts.push(
    `Good morning. It is ${dateLabel}. I am your Grasshopper News intelligence analyst. ` +
    `Here is your complete briefing for the Australian Beef and Lamb industry. ` +
    `We are tracking ${articles.length} intelligence items today — ` +
    `${high.length} critical alert${high.length !== 1 ? 's' : ''}, ` +
    `${medium.length} medium-impact development${medium.length !== 1 ? 's' : ''}, ` +
    `and ${low.length} lower-priority item${low.length !== 1 ? 's' : ''}.`
  )

  // SECTION ONE — CRITICAL ALERTS
  if (high.length > 0) {
    parts.push(`Moving to our critical alerts section. We have ${high.length} high-impact development${high.length !== 1 ? 's' : ''} requiring immediate leadership attention.`)
    for (const a of high) {
      const reg  = (a.regions ?? []).filter((r: string) => r !== 'National').join(' and ') || 'national operations'
      const fin  = a.financial_impact_label ? ` Financial exposure is estimated at ${a.financial_impact_label}.` : ''
      const rec  = a.strategic_recommendation ? ` The recommended action is: ${a.strategic_recommendation}` : ''
      const why  = a.why_it_matters ? ` ${a.why_it_matters}` : ''
      const stim = a.short_term_impact ? ` In the short term: ${a.short_term_impact}` : ''
      parts.push(`${a.headline}. This development affects ${reg}.${why}${stim}${fin}${rec}`)
    }
  } else {
    parts.push(`There are no critical high-impact alerts at this time. Moving to market intelligence.`)
  }

  // SECTION TWO — MARKET INTELLIGENCE
  parts.push(`Moving to our market intelligence section.`)
  const market = articles.filter((a: any) =>
    ['Market & Economy', 'Export / Trade', 'Forecasts / Projections', 'Production Costs'].includes(a.category)
  ).slice(0, 5)
  if (market.length > 0) {
    for (const a of market) {
      const why = a.why_it_matters ? ` ${a.why_it_matters}` : ''
      const med = a.medium_term_impact ? ` Looking further ahead: ${a.medium_term_impact}` : ''
      parts.push(`${a.headline}.${why}${med}`)
    }
  } else {
    parts.push(`No specific market price or trade data is available in today's intelligence feed. Our monitoring across all major Australian and international feeds continues around the clock.`)
  }

  // SECTION THREE — GLOBAL SIGNALS
  const global = articles.filter((a: any) =>
    (a.regions ?? []).some((r: string) => ['Global', 'USA', 'China', 'International', 'NZ', 'EU', 'Brazil'].includes(r))
  ).slice(0, 4)
  if (global.length > 0) {
    parts.push(`Moving to global signals that affect Australian beef and lamb competitiveness.`)
    for (const a of global) {
      const why = a.why_it_matters ? ` ${a.why_it_matters}` : ''
      parts.push(`${a.headline}.${why}`)
    }
  } else {
    parts.push(`No major international signals affecting Australian export markets are recorded in this briefing period.`)
  }

  // SECTION FOUR — DOMESTIC INDUSTRY
  const domestic = [...medium, ...low]
    .filter((a: any) => !(a.regions ?? []).some((r: string) => ['Global', 'USA', 'China', 'Brazil', 'EU'].includes(r)))
    .slice(0, 5)
  if (domestic.length > 0) {
    parts.push(`Moving to domestic industry news.`)
    for (const a of domestic) {
      const why  = a.why_it_matters ? ` ${a.why_it_matters}` : ''
      const stim = a.short_term_impact ? ` Short-term outlook: ${a.short_term_impact}` : ''
      parts.push(`${a.headline}.${why}${stim}`)
    }
  }

  // SECTION FIVE — STRATEGIC OUTLOOK
  const topRisk = high[0] ?? medium[0]
  const topOpp  = medium.find((a: any) => (a.sentiment ?? 0) > 0) ?? medium.find((a: any) => a.strategic_recommendation)
  parts.push(`Moving to our strategic outlook for the week.`)
  if (topRisk) {
    parts.push(
      `The single biggest risk for JBS Southern Australia this week is ${topRisk.headline.toLowerCase()}. ` +
      `${topRisk.strategic_recommendation ? 'Our recommendation: ' + topRisk.strategic_recommendation : ''}`
    )
  }
  if (topOpp && topOpp !== topRisk) {
    parts.push(
      `The primary opportunity is centred on ${topOpp.headline.toLowerCase()}. ` +
      `${topOpp.strategic_recommendation ? topOpp.strategic_recommendation : ''}`
    )
  }
  parts.push(
    `The operations and commercial teams should review today's high-impact items immediately, ` +
    `monitor procurement conditions closely given current market signals, ` +
    `and ensure biosecurity and supply chain protocols are current.`
  )

  // OUTRO
  parts.push(`That concludes your Grasshopper News briefing for ${dateLabel}. Next update tomorrow morning at six AM. Stay informed, stay ahead.`)

  return parts.filter(Boolean).join(' ')
}

// ── Main handler ───────────────────────────────────────────────────────────────

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
  const groqApiKey = Deno.env.get('GROQ_API_KEY') ?? ''

  // Parse optional ?force=true to regenerate today's briefing
  const url       = new URL(req.url)
  const force     = url.searchParams.get('force') === 'true'
  const today     = new Date().toISOString().split('T')[0]
  const now       = new Date()
  const dateLabel = now.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  try {
    // ── 1. Idempotency check (skip when force=true) ───────────────────────────
    if (!force) {
      const { data: existing } = await supabase
        .from('daily_briefings').select('id').eq('briefing_date', today).single()

      if (existing) {
        return new Response(
          JSON.stringify({ ok: true, message: 'Briefing already generated today', date: today }),
          { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
        )
      }
    } else {
      await supabase.from('daily_briefings').delete().eq('briefing_date', today)
    }

    // ── 2. Get articles ───────────────────────────────────────────────────────
    // Priority 1: articles sent by the frontend in the request body (always
    //             reflects what the user sees, works with mock data too).
    // Priority 2: DB query — try 36 h first, then widen to 7 days so a briefing
    //             can always be generated even if news-agent hasn't run recently.

    const IMPACT_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }

    let body: any = {}
    try { body = await req.json() } catch (_) { /* no body is fine */ }

    let articles: any[] = []
    let articleIds: string[] = []
    let articleSource = 'db'

    // ── 2a. Articles from frontend body ──────────────────────────────────────
    if (Array.isArray(body.articles) && body.articles.length > 0) {
      // Frontend sends camelCase — normalise to the snake_case the formatter expects
      articles = body.articles.slice(0, 25).map((a: any) => ({
        id:                        a.id ?? null,
        headline:                  a.headline,
        summary:                   a.summary,
        why_it_matters:            a.whyItMatters ?? a.why_it_matters,
        category:                  a.category,
        impact:                    a.impact,
        regions:                   a.regions ?? [],
        source:                    a.source,
        published_at:              a.publishedAt ?? a.published_at,
        short_term_impact:         a.shortTermImpact ?? a.short_term_impact,
        medium_term_impact:        a.mediumTermImpact ?? a.medium_term_impact,
        strategic_recommendation:  a.strategicRecommendation ?? a.strategic_recommendation,
        financial_impact_label:    a.financialImpactLabel ?? a.financial_impact_label,
        financial_impact_high_aud: a.financialImpactHigh ?? a.financial_impact_high_aud,
      })).sort((a: any, b: any) => {
        const d = (IMPACT_ORDER[a.impact] ?? 2) - (IMPACT_ORDER[b.impact] ?? 2)
        return d !== 0 ? d : new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime()
      })
      articleIds  = articles.map((a: any) => a.id).filter(Boolean)
      articleSource = 'frontend'
      console.log(`Using ${articles.length} articles from frontend body`)
    }

    // ── 2b. DB fallback: 36 h, then widen to 7 days ──────────────────────────
    if (articles.length === 0) {
      const SELECT_COLS = `
        id, headline, summary, why_it_matters, category, impact, regions,
        source, published_at, short_term_impact, medium_term_impact,
        strategic_recommendation, financial_impact_label,
        financial_impact_low_aud, financial_impact_high_aud,
        confidence_score, sentiment, time_horizon
      `
      const cutoff36h = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
      const { data: recent } = await supabase
        .from('articles').select(SELECT_COLS)
        .gte('created_at', cutoff36h).order('confidence_score', { ascending: false }).limit(25)

      if ((recent ?? []).length > 0) {
        articles = recent ?? []
        console.log(`Using ${articles.length} articles from last 36 h (DB)`)
      } else {
        // Widen to 7 days so a manual regenerate always has something to work with
        const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const { data: older } = await supabase
          .from('articles').select(SELECT_COLS)
          .gte('created_at', cutoff7d).order('confidence_score', { ascending: false }).limit(25)
        articles = older ?? []
        console.log(`Using ${articles.length} articles from last 7 days (DB, widened window)`)
      }

      articles = articles.sort((a: any, b: any) => {
        const d = (IMPACT_ORDER[a.impact] ?? 2) - (IMPACT_ORDER[b.impact] ?? 2)
        return d !== 0 ? d : new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      })
      articleIds = articles.map((a: any) => a.id)
      articleSource = 'db'
    }

    const highCount   = articles.filter((a: any) => a.impact === 'HIGH').length
    const mediumCount = articles.filter((a: any) => a.impact === 'MEDIUM').length
    const lowCount    = articles.filter((a: any) => a.impact === 'LOW').length

    console.log(`Briefing source: ${articleSource} | ${highCount} HIGH + ${mediumCount} MEDIUM + ${lowCount} LOW`)

    // ── 3. Build article summary for AI ──────────────────────────────────────
    function formatArticle(a: any, index: number): string {
      const financialNote = a.financial_impact_label
        ? `Financial Impact: ${a.financial_impact_label}`
        : a.financial_impact_high_aud
          ? `Est. Impact: up to AUD ${(a.financial_impact_high_aud / 1_000_000).toFixed(1)} million`
          : 'Financial Impact: not quantified'

      return [
        `[ARTICLE ${index}] IMPACT: ${a.impact} | Category: ${a.category} | Regions: ${(a.regions ?? []).join(', ')} | Source: ${a.source}`,
        `Headline: ${a.headline}`,
        financialNote,
        `Summary: ${a.summary}`,
        `Why it matters: ${a.why_it_matters ?? 'N/A'}`,
        `Short-term outlook: ${a.short_term_impact ?? 'N/A'}`,
        `Recommendation: ${a.strategic_recommendation ?? 'N/A'}`,
      ].join('\n')
    }

    const articlesText = articles.map((a: any, i: number) => formatArticle(a, i + 1)).join('\n\n---\n\n')

    const userPrompt = [
      `DATE: ${dateLabel}`,
      `BRIEFING COVERS: Last 36 hours`,
      `TOTAL ARTICLES: ${articles.length} (${highCount} HIGH, ${mediumCount} MEDIUM, ${lowCount} LOW)`,
      ``,
      `IMPORTANT: You must use ALL ${articles.length} articles below. Do not skip any.`,
      ``,
      `=== ALL ARTICLES (sorted by impact level) ===`,
      articlesText || '(no articles in the last 36 hours)',
    ].join('\n')

    // ── 4. Generate podcast script ────────────────────────────────────────────
    // Always start with the AI-free fallback so there is guaranteed audio content.
    // Groq upgrades it to a full 900-word natural-language script when available.
    let briefingText = articles.length > 0
      ? buildFallbackScript(articles, dateLabel)
      : `Good morning. It is ${dateLabel}. I am your Grasshopper News intelligence analyst. No new intelligence has been recorded in the last thirty-six hours. The platform continues to monitor all major Australian and international feeds. Full intelligence will be available once new articles are ingested. Stay informed, stay ahead.`

    console.log(`Fallback script: ~${briefingText.split(/\s+/).filter(Boolean).length} words`)

    if (articles.length > 0 && groqApiKey) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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

        if (res.ok) {
          const data = await res.json()
          const generated = (data.choices?.[0]?.message?.content ?? '').trim()
          const wc = generated.split(/\s+/).filter(Boolean).length
          console.log(`Groq returned ~${wc} words`)
          if (wc >= 200) {
            // Accept any Groq response ≥ 200 words — full target is 900-1100
            briefingText = generated
            console.log(`Using Groq script (~${wc} words)`)
          } else {
            console.warn(`Groq response too short (~${wc} words) — keeping AI-free fallback`)
          }
        } else {
          const errText = await res.text()
          console.warn(`Groq failed: ${res.status} — ${errText} — keeping AI-free fallback`)
        }
      } catch (err) {
        console.error(`Groq call error — keeping AI-free fallback:`, err)
      }
    } else if (!groqApiKey) {
      console.log('GROQ_API_KEY not set — using AI-free fallback script')
    }

    // Estimate runtime: ~125 wpm average TTS speed at 0.95 rate
    const wordCount     = briefingText.split(/\s+/).length
    const estimatedMins = Math.round(wordCount / 125)

    // ── 5. Store briefing ─────────────────────────────────────────────────────
    const { error: insertError } = await supabase.from('daily_briefings').upsert({
      briefing_date:  today,
      briefing_text:  briefingText,
      article_ids:    articleIds,
      article_count:  articles.length,
      change_count:   articles.length,
    }, { onConflict: 'briefing_date' })

    if (insertError) throw new Error(`Failed to store briefing: ${insertError.message}`)

    console.log(`Briefing stored for ${today}: ${articles.length} articles, ${wordCount} words (~${estimatedMins} min)`)

    return new Response(
      JSON.stringify({
        ok:            true,
        briefing_date: today,
        article_count: articles.length,
        high_count:    highCount,
        medium_count:  mediumCount,
        low_count:     lowCount,
        word_count:    wordCount,
        estimated_mins: estimatedMins,
      }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    )
  } catch (err) {
    console.error('Daily briefing failed:', err)
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    )
  }
})
