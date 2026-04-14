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

const PODCAST_SYSTEM_PROMPT = `You are a professional broadcast journalist and senior commodity market analyst presenting the daily intelligence briefing for Grasshopper News. Your audience is JBS Southern Australia senior leadership — one of Australia's largest beef and lamb processors.

CRITICAL WRITING RULES:
- Write in clear, confident, spoken English — as if you are speaking directly into a microphone at 6 AM
- NO bullet points, NO asterisks, NO pound signs, NO markdown of any kind in the output text
- Full flowing sentences throughout. No abbreviations that would sound odd when spoken aloud.
- Every number must be spoken as words: write "two point three million dollars" not "$2.3M", write "ninety-four US cents to the dollar" not "0.94", write "six percent" not "6%"
- Section headers must be spoken as transitions: say "Moving to our market intelligence section." not "## SECTION 2"
- NEVER invent facts not present in the provided articles. If you don't have a price, say you don't have it.
- You MUST use ALL provided articles. Do not skip any article — weave every story into the appropriate section.
- Target length: MINIMUM 900 words, MAXIMUM 1,100 words. Count every word you write. If you are under 900 words after the Outro, go back and expand each section. A 900-word script takes approximately seven minutes to read aloud.
- Do NOT finish early. Do NOT summarise briefly. Write in full sentences until you reach at least 900 words.

EXACT STRUCTURE TO FOLLOW:

INTRO (60 to 80 words)
Open with: "Good morning. It is [WEEKDAY], [DATE]. I am your Grasshopper News intelligence analyst."
Follow with a one sentence summary of market mood today and how many significant developments are in this briefing.

SECTION ONE — CRITICAL ALERTS (approximately 150 words)
Cover all HIGH impact articles. For each story: state what happened, which operation or region is affected — South Australia, Victoria, New South Wales, or Tasmania — and what action JBS leadership should consider today. Be direct: "This directly affects JBS because..."
If there are no HIGH impact stories, say so briefly and transition.

SECTION TWO — MARKET INTELLIGENCE (approximately 200 words)
Cover current market conditions. If AUD to USD exchange rate data is provided, state it and the trend direction. If MLA EYCI beef indicator data is available, state it. Cover South Australia lamb and beef price movements if mentioned in any article. Cover any shipping or freight cost movements. Provide a brief interpretation of what current conditions mean for JBS margins this week. If specific price data is not available in the provided articles, acknowledge it briefly and move on.

SECTION THREE — GLOBAL SIGNALS (approximately 150 words)
Cover international stories that affect Australian beef and lamb: United States or China trade tensions, foot and mouth disease outbreaks anywhere in the world, Middle East or European conflicts affecting shipping lanes or fuel costs, competitor country production changes from the United States, Brazil, Argentina, New Zealand, or the European Union, any currency drivers for the Australian dollar, and any import or export tariff changes that affect access to key markets.

SECTION FOUR — DOMESTIC INDUSTRY NEWS (approximately 200 words)
Cover MEDIUM and LOW impact Australian stories: processing capacity and throughput, supply chain disruptions, weather events affecting grazing conditions, biosecurity announcements, regulation changes including live export rules, labour market developments, MLA or ABARES announcements, retail demand shifts, and supermarket pricing pressure on beef and lamb.

SECTION FIVE — STRATEGIC OUTLOOK (approximately 150 words)
Synthesise the above into a forward-looking view. State the single biggest risk for JBS Southern Australia this week. State the single biggest opportunity. Provide two or three specific recommended actions for the operations or commercial team, each referencing a specific story from the briefing.

OUTRO (40 to 60 words)
Close with: "That concludes your Grasshopper News briefing for [DATE]. Next update tomorrow morning at six AM. Stay informed, stay ahead."`

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
    // ── 1. Idempotency check ──────────────────────────────────────────────────
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

    // ── 2. Fetch all articles from the last 36 hours ──────────────────────────
    // 36 hours covers weekends and ensures we always have content
    const cutoff36h = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()

    const { data: allArticles } = await supabase
      .from('articles')
      .select(`
        id, headline, summary, why_it_matters, category, impact, regions,
        source, published_at, short_term_impact, medium_term_impact,
        strategic_recommendation, financial_impact_label,
        financial_impact_low_aud, financial_impact_high_aud,
        verification_status, confidence_score, sentiment, time_horizon
      `)
      .gte('created_at', cutoff36h)
      .order('confidence_score', { ascending: false })
      .limit(25)

    // Sort: HIGH first, then MEDIUM, then LOW — newest within each group
    const IMPACT_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }
    const articles = (allArticles ?? []).sort((a: any, b: any) => {
      const d = (IMPACT_ORDER[a.impact] ?? 2) - (IMPACT_ORDER[b.impact] ?? 2)
      return d !== 0 ? d : new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    })

    const articleIds  = articles.map((a: any) => a.id)
    const highCount   = articles.filter((a: any) => a.impact === 'HIGH').length
    const mediumCount = articles.filter((a: any) => a.impact === 'MEDIUM').length
    const lowCount    = articles.filter((a: any) => a.impact === 'LOW').length

    console.log(`Podcast: ${highCount} HIGH + ${mediumCount} MEDIUM + ${lowCount} LOW articles from last 36h`)

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

    // ── 4. Generate podcast script via Groq ───────────────────────────────────
    let briefingText = `Good morning. It is ${dateLabel}. I am your Grasshopper News intelligence analyst. No significant intelligence developments have been recorded in the last thirty-six hours. The platform continues to monitor all major Australian and international feeds. Full intelligence will be available in tomorrow's briefing. That concludes today's update. Stay informed, stay ahead.`

    if (articles.length > 0 && groqApiKey) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            temperature: 0.4,
            max_tokens: 2500,
            messages: [
              { role: 'system', content: PODCAST_SYSTEM_PROMPT },
              { role: 'user',   content: userPrompt },
            ],
          }),
          signal: AbortSignal.timeout(90_000),
        })

        if (res.ok) {
          const data = await res.json()
          const generated = data.choices?.[0]?.message?.content ?? ''
          if (generated.length > 300) {
            briefingText = generated
            console.log(`Groq generated ${generated.length} chars, ~${generated.split(/\s+/).length} words`)
          } else {
            console.warn(`Groq returned short response (${generated.length} chars) — using fallback`)
          }
        } else {
          const errText = await res.text()
          console.warn(`Groq podcast generation failed: ${res.status} — ${errText}`)
        }
      } catch (err) {
        console.error('Podcast generation error:', err)
      }
    }

    // Estimate runtime: ~125 wpm average TTS speed at 0.95 rate
    const wordCount     = briefingText.split(/\s+/).length
    const estimatedMins = Math.round(wordCount / 125)

    // ── 5. Store briefing ─────────────────────────────────────────────────────
    const { error: insertError } = await supabase.from('daily_briefings').insert({
      briefing_date:  today,
      briefing_text:  briefingText,
      article_ids:    articleIds,
      article_count:  articles.length,
      change_count:   articles.length,
    })

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
