/**
 * KEEP ME POSTED — AI News Agent
 * Supabase Edge Function (Deno runtime)
 *
 * Runs every hour via pg_cron. For each run it:
 *   1. Fetches articles from free RSS feeds + NewsAPI (optional)
 *   2. Deduplicates against articles already in the database
 *   3. Filters candidates for Australian beef/lamb relevance
 *   4. Sends each new relevant article to Claude for full analysis
 *   5. Persists analysed articles to Supabase
 *
 * Environment variables (set in Supabase dashboard → Settings → Edge Functions):
 *   ANTHROPIC_API_KEY   — required
 *   NEWS_API_KEY        — optional (newsapi.org free tier)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.0'
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.3.4'

// ── Types ────────────────────────────────────────────────────────────────────

interface RawArticle {
  title: string
  description: string
  url: string
  publishedAt: string
  source: string
  content?: string
}

interface AnalysedArticle {
  headline: string
  summary: string
  why_it_matters: string
  category: string
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  regions: string[]
  short_term_impact: string
  medium_term_impact: string
  strategic_recommendation: string
  confidence_score: number
  tags: string[]
  sentiment: number
  is_relevant: boolean
}

// ── Configuration ────────────────────────────────────────────────────────────

/** Free RSS feeds from trusted Australian agriculture sources */
const RSS_FEEDS = [
  {
    name: 'Beef Central',
    url: 'https://www.beefcentral.com/feed/',
    baseConfidence: 92,
  },
  {
    name: 'ABC Rural',
    url: 'https://www.abc.net.au/news/feed/2942578/rss.xml',
    baseConfidence: 90,
  },
  {
    name: 'The Land',
    url: 'https://www.theland.com.au/rss.xml',
    baseConfidence: 87,
  },
  {
    name: 'Farm Online',
    url: 'https://www.farmonline.com.au/rss.xml',
    baseConfidence: 84,
  },
  {
    name: 'Stock Journal',
    url: 'https://www.stockjournal.com.au/rss.xml',
    baseConfidence: 85,
  },
  {
    name: 'Sheep Central',
    url: 'https://www.sheepcentral.com/feed/',
    baseConfidence: 88,
  },
  {
    name: 'Grain Central',
    url: 'https://www.graincentral.com/feed/',
    baseConfidence: 82, // relevant for feed grain costs
  },
  {
    name: 'MLA News',
    url: 'https://www.mla.com.au/news-and-events/industry-news/rss/',
    baseConfidence: 94,
  },
]

/** NewsAPI.org search terms for AU beef/lamb industry */
const NEWSAPI_QUERIES = [
  'beef australia livestock',
  'lamb australia agriculture',
  'cattle drought australia',
  'livestock export australia saleyard',
  'ABARES forecast agricultural',
  'meat processing australia meatworks',
  'feedlot grain cost australia',
  'biosecurity livestock australia',
]

/** Quick relevance filter — articles must match at least one keyword */
const RELEVANCE_KEYWORDS = [
  'beef', 'lamb', 'cattle', 'livestock', 'sheep', 'wool',
  'abattoir', 'meatworks', 'saleyard', 'feedlot', 'lot feed',
  'ABARES', 'MLA', 'meat & livestock', 'live export',
  'drought', 'pasture', 'rainfall', 'el nino', 'la nina',
  'agricultural', 'agriculture', 'agribusiness', 'farm',
  'export beef', 'export lamb', 'china beef', 'japan beef',
  'grazing', 'producers', 'processor',
]

/** Claude system prompt — defines the analyst persona and JSON schema */
const SYSTEM_PROMPT = `You are a senior business intelligence analyst for the Australian beef and lamb industry. You assess news articles for operational and strategic impact on livestock processors, exporters, traders, and producers operating in South Australia (SA), Victoria (VIC), New South Wales (NSW), and Tasmania (TAS).

Analyze the provided article and respond with ONLY a valid JSON object — no preamble, no explanation, no markdown fences. Just raw JSON.

Required JSON structure:
{
  "headline": "concise, specific headline (max 130 characters — improve if vague)",
  "summary": "2–4 sentence executive summary covering what happened, key facts, and magnitude",
  "why_it_matters": "1–2 sentences on direct business relevance to AU beef/lamb operators",
  "category": one of exactly: "Market & Economy" | "Legislation / Regulation" | "Competition" | "Climate / Weather" | "Supply Chain" | "Export / Trade" | "Production Costs" | "Forecasts / Projections",
  "impact": "HIGH" | "MEDIUM" | "LOW",
  "regions": array of applicable values from: ["SA", "VIC", "NSW", "TAS", "National", "Global"],
  "short_term_impact": "Specific operational impact in next 0–60 days for AU beef/lamb businesses",
  "medium_term_impact": "Strategic impact in 60–180 days",
  "strategic_recommendation": "One clear, actionable recommendation for beef/lamb business operators",
  "confidence_score": integer 60–98 reflecting source reliability and signal strength,
  "tags": array of 3–8 specific lowercase keyword tags,
  "sentiment": float from -1.0 (very negative for industry) to 1.0 (very positive),
  "is_relevant": true if article clearly impacts AU beef/lamb industry, false to discard
}

Impact scoring guide:
- HIGH: Regulatory/policy changes, drought/biosecurity emergencies, export market closures, >10% price movements, major supply chain disruptions
- MEDIUM: 5–15% price movements, significant weather events, competitor activity, RBA/currency impacts, feed cost shifts
- LOW: Minor local market news, <5% price movements, general interest rural content

If the article has no clear relevance to Australian beef or lamb (e.g. poultry, pork, NZ-only, unrelated), set is_relevant to false.`

// ── Helpers ──────────────────────────────────────────────────────────────────

/** SHA-256 hash of a string — used for deduplication key */
async function sha256(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Check if a raw article title/description is potentially relevant */
function isLikelyRelevant(article: RawArticle): boolean {
  const text = `${article.title} ${article.description}`.toLowerCase()
  return RELEVANCE_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()))
}

/** Parse an RSS feed URL → array of RawArticles */
async function fetchRSSFeed(
  feedUrl: string,
  sourceName: string,
): Promise<RawArticle[]> {
  const res = await fetch(feedUrl, {
    headers: { 'User-Agent': 'KeepMePosted/1.0 (news aggregator)' },
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) throw new Error(`HTTP ${res.status} from ${feedUrl}`)

  const xml = await res.text()
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
  const parsed = parser.parse(xml)

  const channel = parsed?.rss?.channel ?? parsed?.feed ?? {}
  const items: any[] = channel.item ?? channel.entry ?? []
  const itemArray = Array.isArray(items) ? items : [items]

  return itemArray.slice(0, 20).map((item: any) => ({
    title: item.title?.['#text'] ?? item.title ?? '',
    description: item.description?.['#text'] ?? item.description ?? item.summary?.['#text'] ?? item.summary ?? '',
    url: item.link?.['@_href'] ?? item.link ?? item.guid?.['#text'] ?? item.guid ?? '',
    publishedAt: item.pubDate ?? item.updated ?? item.published ?? new Date().toISOString(),
    source: sourceName,
    content: item['content:encoded'] ?? item.content?.['#text'] ?? '',
  }))
}

/** Fetch articles from NewsAPI.org (optional — requires API key) */
async function fetchNewsAPI(apiKey: string): Promise<RawArticle[]> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const articles: RawArticle[] = []

  // Run queries sequentially to avoid rate limits
  for (const q of NEWSAPI_QUERIES.slice(0, 4)) {
    try {
      const url = new URL('https://newsapi.org/v2/everything')
      url.searchParams.set('q', q)
      url.searchParams.set('language', 'en')
      url.searchParams.set('sortBy', 'publishedAt')
      url.searchParams.set('from', yesterday)
      url.searchParams.set('pageSize', '10')
      url.searchParams.set('apiKey', apiKey)

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8_000) })
      if (!res.ok) continue

      const data = await res.json()
      for (const a of data.articles ?? []) {
        articles.push({
          title: a.title ?? '',
          description: a.description ?? '',
          url: a.url ?? '',
          publishedAt: a.publishedAt ?? new Date().toISOString(),
          source: a.source?.name ?? 'NewsAPI',
          content: a.content ?? '',
        })
      }

      // Small delay between requests
      await new Promise((r) => setTimeout(r, 300))
    } catch {
      // Continue on individual query failure
    }
  }

  return articles
}

/** Call Claude to analyse a single article */
async function analyseArticle(
  client: Anthropic,
  article: RawArticle,
  baseConfidence: number,
): Promise<AnalysedArticle | null> {
  const userContent = `
Source: ${article.source}
Published: ${article.publishedAt}
URL: ${article.url}

Title: ${article.title}

Content:
${(article.description + '\n' + (article.content ?? '')).slice(0, 3000)}
`.trim()

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    // Strip any accidental markdown fences
    const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(jsonStr) as AnalysedArticle

    // Blend AI confidence with source base confidence
    result.confidence_score = Math.round(
      result.confidence_score * 0.7 + baseConfidence * 0.3,
    )

    return result
  } catch (err) {
    console.error(`Claude analysis failed for "${article.title}":`, err)
    return null
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // Support CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const runStart = Date.now()

  // Initialise clients
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const anthropic = new Anthropic({
    apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '',
  })

  const newsApiKey = Deno.env.get('NEWS_API_KEY') ?? ''

  // Log the run start
  const { data: runData } = await supabase
    .from('agent_runs')
    .insert({ status: 'running' })
    .select('id')
    .single()
  const runId = runData?.id

  const stats = {
    sources_fetched: 0,
    articles_found: 0,
    articles_new: 0,
    articles_analysed: 0,
  }

  try {
    // ── 1. Collect raw articles from all sources ──────────────────────────

    const rawArticles: (RawArticle & { baseConfidence: number })[] = []

    // RSS feeds (free, no quota)
    for (const feed of RSS_FEEDS) {
      try {
        const items = await fetchRSSFeed(feed.url, feed.name)
        rawArticles.push(...items.map((a) => ({ ...a, baseConfidence: feed.baseConfidence })))
        stats.sources_fetched++
      } catch (err) {
        console.warn(`RSS feed failed: ${feed.name}`, err)
      }
    }

    // NewsAPI (optional)
    if (newsApiKey) {
      try {
        const items = await fetchNewsAPI(newsApiKey)
        rawArticles.push(...items.map((a) => ({ ...a, baseConfidence: 78 })))
        stats.sources_fetched++
      } catch (err) {
        console.warn('NewsAPI fetch failed:', err)
      }
    }

    stats.articles_found = rawArticles.length
    console.log(`Fetched ${rawArticles.length} raw articles from ${stats.sources_fetched} sources`)

    // ── 2. Deduplicate against DB ─────────────────────────────────────────

    // Build external_ids for all candidates
    const candidates = await Promise.all(
      rawArticles
        .filter((a) => a.url && a.title)
        .map(async (a) => ({ ...a, externalId: await sha256(a.url) })),
    )

    // Fetch IDs already in DB
    const externalIds = candidates.map((c) => c.externalId)
    const { data: existing } = await supabase
      .from('articles')
      .select('external_id')
      .in('external_id', externalIds)

    const existingSet = new Set((existing ?? []).map((r: any) => r.external_id))

    const newCandidates = candidates.filter((c) => !existingSet.has(c.externalId))
    stats.articles_new = newCandidates.length
    console.log(`${newCandidates.length} new articles to process (${externalIds.length - newCandidates.length} duplicates skipped)`)

    // ── 3. Pre-filter for likely relevance (save Claude API calls) ────────

    const relevant = newCandidates.filter(isLikelyRelevant)
    console.log(`${relevant.length} articles passed relevance pre-filter`)

    // ── 4. Analyse each new article with Claude ───────────────────────────

    const toInsert: any[] = []

    for (const article of relevant) {
      const analysis = await analyseArticle(anthropic, article, article.baseConfidence)

      if (!analysis || !analysis.is_relevant) {
        console.log(`Discarded: "${article.title.slice(0, 60)}"`)
        continue
      }

      toInsert.push({
        external_id: article.externalId,
        headline: analysis.headline || article.title,
        summary: analysis.summary,
        why_it_matters: analysis.why_it_matters,
        category: analysis.category,
        impact: analysis.impact,
        regions: analysis.regions ?? [],
        source: article.source,
        source_url: article.url,
        published_at: article.publishedAt,
        short_term_impact: analysis.short_term_impact,
        medium_term_impact: analysis.medium_term_impact,
        strategic_recommendation: analysis.strategic_recommendation,
        confidence_score: analysis.confidence_score,
        tags: analysis.tags ?? [],
        sentiment: analysis.sentiment ?? 0,
        trending: (analysis.impact === 'HIGH'),
        raw_content: (article.description + ' ' + (article.content ?? '')).slice(0, 5000),
      })

      stats.articles_analysed++

      // Rate-limit: ~4 Claude calls/sec max to stay well within limits
      await new Promise((r) => setTimeout(r, 250))
    }

    // ── 5. Bulk insert analysed articles ─────────────────────────────────

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('articles')
        .upsert(toInsert, { onConflict: 'external_id', ignoreDuplicates: true })

      if (insertError) {
        throw new Error(`DB insert failed: ${insertError.message}`)
      }
      console.log(`Inserted ${toInsert.length} articles into database`)
    }

    // ── 6. Update run log ─────────────────────────────────────────────────

    await supabase.from('agent_runs').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - runStart,
      ...stats,
    }).eq('id', runId)

    return new Response(
      JSON.stringify({ ok: true, ...stats, duration_ms: Date.now() - runStart }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    )
  } catch (err) {
    console.error('Agent run failed:', err)

    await supabase.from('agent_runs').update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - runStart,
      error_message: String(err),
      ...stats,
    }).eq('id', runId)

    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
    )
  }
})
