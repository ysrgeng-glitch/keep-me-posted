/**
 * JBS Southern Australia — Strategic Intelligence Agent v2
 * Supabase Edge Function (Deno runtime)
 *
 * Institutional-grade news ingestion with:
 *   - Source validation & verification classification
 *   - Financial impact quantification in AUD
 *   - Time horizon assessment
 *   - JBS Southern Australia operational context
 *
 * 100% FREE: Groq free tier (14,400 req/day, Llama 3.3-70B)
 * Get key at: https://console.groq.com
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.3.4'

// ── Types ─────────────────────────────────────────────────────────────────────

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
  verification_status: 'VERIFIED_OFFICIAL' | 'ANALYST_INFERENCE' | 'UNCONFIRMED'
  financial_impact_low_aud: number | null
  financial_impact_high_aud: number | null
  financial_impact_label: string | null
  time_horizon: 'IMMEDIATE' | '30D' | '90D' | '6M' | '12M'
}

// ── Configuration ─────────────────────────────────────────────────────────────

const RSS_FEEDS = [
  // ── Official / government (auto VERIFIED_OFFICIAL) ─────────────────────
  { name: 'MLA News',          url: 'https://www.mla.com.au/news-and-events/industry-news/rss/',    baseConfidence: 96, isOfficial: true  },
  { name: 'USDA AMS Livestock',url: 'https://www.ams.usda.gov/rss/LSA_whats_new.xml',               baseConfidence: 93, isOfficial: true  },

  // ── Core Australian agri media ──────────────────────────────────────────
  { name: 'Beef Central',      url: 'https://www.beefcentral.com/feed/',                            baseConfidence: 92, isOfficial: false },
  { name: 'ABC Rural',         url: 'https://www.abc.net.au/news/feed/2942578/rss.xml',             baseConfidence: 90, isOfficial: false },
  { name: 'The Land',          url: 'https://www.theland.com.au/rss.xml',                           baseConfidence: 87, isOfficial: false },
  { name: 'Stock Journal',     url: 'https://www.stockjournal.com.au/rss.xml',                      baseConfidence: 88, isOfficial: false },
  { name: 'Sheep Central',     url: 'https://www.sheepcentral.com/feed/',                           baseConfidence: 88, isOfficial: false },
  { name: 'Grain Central',     url: 'https://www.graincentral.com/feed/',                           baseConfidence: 84, isOfficial: false },
  { name: 'Farm Online',       url: 'https://www.farmonline.com.au/rss.xml',                        baseConfidence: 84, isOfficial: false },
  { name: 'Weekly Times',      url: 'https://www.weeklytimesnow.com.au/rss.xml',                    baseConfidence: 83, isOfficial: false },
  { name: 'ABC News AU',       url: 'https://www.abc.net.au/news/feed/51120/rss.xml',               baseConfidence: 86, isOfficial: false },

  // ── International beef/lamb industry ───────────────────────────────────
  { name: 'The Cattle Site',   url: 'https://www.thecattlesite.com/news/rss/',                      baseConfidence: 84, isOfficial: false },
  { name: 'Drovers',           url: 'https://www.drovers.com/rss.xml',                              baseConfidence: 82, isOfficial: false },
  { name: 'Global Meat News',  url: 'https://www.globalmeatnews.com/rss/topic/beef-and-veal',       baseConfidence: 80, isOfficial: false },
  { name: 'Beef Magazine',     url: 'https://www.beefmagazine.com/rss.xml',                         baseConfidence: 80, isOfficial: false },
  { name: 'AHDB Beef & Lamb',  url: 'https://ahdb.org.uk/beef-and-lamb/news/rss',                   baseConfidence: 85, isOfficial: true  },
  { name: 'AgWeb',             url: 'https://www.agweb.com/rss/news',                               baseConfidence: 78, isOfficial: false },

  // ── Global markets, trade & geopolitics ────────────────────────────────
  { name: 'Reuters Trade',     url: 'https://feeds.reuters.com/reuters/businessNews',               baseConfidence: 88, isOfficial: false },
  { name: 'The Guardian',      url: 'https://www.theguardian.com/business/rss',                     baseConfidence: 82, isOfficial: false },
  { name: 'BBC World',         url: 'https://feeds.bbci.co.uk/news/world/rss.xml',                  baseConfidence: 83, isOfficial: false },
]

/** Official source names — guarantee VERIFIED_OFFICIAL status */
const OFFICIAL_SOURCE_NAMES = new Set([
  'MLA News', 'ABARES', 'ABS', 'BOM', 'DAFF',
  'Australian Government', 'Department of Agriculture',
  'USDA AMS Livestock', 'AHDB Beef & Lamb',
])

/** Quick relevance pre-filter — includes global signals that affect AU beef/lamb */
const RELEVANCE_KEYWORDS = [
  // Core product
  'beef', 'lamb', 'cattle', 'livestock', 'sheep', 'wool', 'mutton', 'veal',
  'abattoir', 'meatworks', 'saleyard', 'feedlot', 'lot feed', 'carcass',
  'EYCI', 'ABARES', 'MLA', 'meat & livestock', 'live export', 'carcase',

  // Australian context
  'drought', 'pasture', 'rainfall', 'el nino', 'la nina', 'flood',
  'agricultural', 'agriculture', 'agribusiness', 'farm', 'rural',
  'grazing', 'producers', 'processor', 'JBS', 'feedstock',

  // Export markets (directly relevant to AU processors)
  'china beef', 'japan beef', 'korea beef', 'us beef',
  'china import', 'beef export', 'lamb export',
  'middle east', 'halal', 'indonesia livestock',

  // Global disease / biosecurity
  'foot and mouth', 'FMD', 'biosecurity', 'lumpy skin', 'african swine fever',
  'bluetongue', 'scrapie', 'BSE', 'avian influenza',

  // Shipping / freight / logistics
  'shipping', 'freight', 'container', 'port strike', 'suez', 'panama canal',
  'reefer', 'cold chain', 'logistics disruption',

  // Geopolitical / trade (only kept if commodity-relevant)
  'tariff', 'trade war', 'sanctions', 'trade dispute', 'trade deal',
  'free trade agreement', 'FTA', 'import ban', 'export ban',

  // Commodities & inputs
  'oil price', 'fuel price', 'diesel', 'grain', 'crop', 'harvest', 'feed grain',
  'aud usd', 'exchange rate', 'currency', 'interest rate',
  'protein market', 'commodity', 'supply chain',
]

/** Trusted sources bypass keyword filter — all their articles are candidates */
const TRUSTED_SOURCES = new Set([
  // AU agri
  'Beef Central', 'Sheep Central', 'MLA News', 'Stock Journal',
  'The Land', 'Farm Online', 'ABC Rural', 'Grain Central', 'Weekly Times',
  'ABC News AU', 'ABC News',
  // International agri
  'The Cattle Site', 'Drovers', 'Global Meat News', 'Beef Magazine',
  'AHDB Beef & Lamb', 'USDA AMS Livestock', 'AgWeb',
  // Trade / finance / geopolitics
  'Reuters Trade', 'Reuters', 'Bloomberg', 'The Guardian',
  'AP', 'AAP', 'BBC World', 'The Australian', 'Australian Financial Review',
])

// ── AI System Prompt ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior strategic intelligence analyst for JBS Southern Australia — a major beef and lamb processor.

COMPANY CONTEXT:
- Processes ~1,500 head of cattle/day and ~15,000 lambs/week across SA, VIC, NSW, TAS
- Annual revenue approximately $800M–$1.2B AUD
- Key financial exposures: live cattle/lamb prices (EYCI, NTI), export markets (China, Japan, US, Korea, Middle East), AUD/USD FX, feed grain costs, freight rates, labour costs, regulatory compliance
- Primary processing states: South Australia (main hub), Victoria, New South Wales, Tasmania
- Export exposure: ~35% of product exported to Asia-Pacific; freight disruptions and FX movements directly impact margins
- Supply exposure: herd conditions in QLD/NSW/SA drive cattle supply and live prices

GLOBAL INTELLIGENCE SCOPE:
Monitor and analyse global events ONLY if they materially affect Australian beef/lamb operations:
- Geopolitical conflicts → disruption to export shipping lanes or key buyer countries
- Trade disputes / tariffs → market access changes for AU beef/lamb
- Global disease outbreaks → biosecurity risk or competitor supply disruption
- Competitor country supply changes (US, Brazil, NZ, Argentina, India) → price/market share shifts
- Shipping/freight disruptions → cold-chain cost and delivery risk
- Oil/fuel movements → processing and freight cost impact
- AUD/USD moves → export revenue impact
- China market policy → AU's largest beef export market

TASK: Analyse the provided article and return EXACTLY this JSON object (no other fields, no markdown):

{
  "headline": "Concise factual headline max 130 chars — improve if vague, NEVER sensationalise",
  "summary": "2–4 sentence executive summary: what happened, key verified facts, magnitude",
  "why_it_matters": "1–2 sentences: direct financial/operational relevance to JBS Southern Australia specifically",
  "category": "EXACTLY one of: Market & Economy | Legislation / Regulation | Competition | Climate / Weather | Supply Chain | Export / Trade | Production Costs | Forecasts / Projections",
  "impact": "HIGH | MEDIUM | LOW — based on estimated AUD impact: HIGH >$500K, MEDIUM $100K–$500K, LOW <$100K",
  "regions": ["subset of: SA | VIC | NSW | TAS | National | Global — use Global when the primary event is international; use National when it affects all Australian states; use state codes for state-specific impacts only"],
  "short_term_impact": "Specific operational impact on JBS within next 60 days",
  "medium_term_impact": "Strategic impact on JBS in 60–180 day horizon",
  "strategic_recommendation": "One clear actionable recommendation for JBS leadership",
  "confidence_score": 75,
  "tags": ["3–8 lowercase tags from: beef, lamb, cattle, sheep, eyci, nti, mla, abares, export, import, china, japan, korea, us-market, brazil-competition, nz-competition, trade-war, tariff, fta, sanctions, currency, aud-usd, fmd, biosecurity, biosecurity-global, lumpy-skin, african-swine-fever, shipping, freight, container, suez, panama-canal, red-sea, fuel, cold-chain, drought, weather, flood, la-nina, el-nino, feedlot, saleyard, processing, labour, regulation, live-export, escas, retail, supermarket, geopolitical, middle-east, ukraine, conflict, supply-chain, interest-rate, inflation, commodity, forecast, production"],
  "sentiment": 0.0,
  "is_relevant": true,
  "financial_impact_low_aud": 200000,
  "financial_impact_high_aud": 800000,
  "financial_impact_label": "$200K–$800K EBITDA Risk",
  "time_horizon": "90D"
}

FIELD RULES:
- confidence_score: integer 65–98 (source reliability × signal strength)
- sentiment: float -1.0 (very negative for AU beef/lamb industry) to +1.0 (very positive)
- financial_impact_low_aud / financial_impact_high_aud: integer AUD estimate of min/max impact on JBS Southern Australia. Calibrate to JBS scale ($800M–$1.2B revenue, ~$70M–$100M EBITDA). ALWAYS provide an estimate — even market price moves of 1c/kg × 1,500 head/day = ~$5K/day. For HIGH impact: typically $500K–$5M. For MEDIUM: $100K–$500K. For LOW: $20K–$100K.
- financial_impact_label: ALWAYS provide a non-null string: e.g. "$500K–$2.0M EBITDA Risk" or "$1.5M–$3.0M Revenue Upside" or "$50K–$200K Operational Exposure". Use "Risk" for negative sentiment, "Upside" for positive, "Exposure" for uncertain.
- time_horizon: IMMEDIATE=0–7 days, 30D=8–30 days, 90D=31–90 days, 6M=91–180 days, 12M=181–365 days
- is_relevant: false only for poultry-only, pork-only, or stories with zero plausible connection to AU beef/lamb processing or supply chain. International stories ARE relevant if they affect AU export markets, shipping, or competitor supply.
- For any article mentioning wars, military conflict, shipping disruption, Panama Canal, Suez Canal, Red Sea, fuel prices, or major currency movements — ALWAYS set at least one region tag to "Global" and evaluate impact on Australian beef/lamb export competitiveness and AUD value. Set is_relevant to true.
- For articles about US/China trade relations, Brazilian or Argentine beef production, NZ lamb supply, EU agricultural policy — always set is_relevant to true and assess direct competitive impact on JBS.

VERIFICATION RULES — MUST FOLLOW:
- Set verification_status to "VERIFIED_OFFICIAL" if source is: MLA News, ABARES, ABS, BOM, DAFF, Australian Government, Department of Agriculture, USDA AMS Livestock, AHDB Beef & Lamb, or any government/official body
- Set verification_status to "ANALYST_INFERENCE" (NEVER "UNCONFIRMED") if source is ANY of: Beef Central, Sheep Central, The Land, Stock Journal, Farm Online, ABC Rural, ABC News, ABC News AU, Grain Central, Weekly Times, The Cattle Site, Drovers, Global Meat News, Beef Magazine, AgWeb, Reuters, Reuters Trade, Bloomberg, The Guardian, AP, AAP, BBC, BBC World, The Australian, Australian Financial Review, SBS News
- Only use "UNCONFIRMED" for sources NOT on the above lists, or for social media posts and unknown blogs

SOURCE CREDIBILITY — REJECT if:
- Source is a social media post, blog, or unknown outlet
- Claims are extraordinary without citing any verifiable source
- Story contradicts well-established facts without evidence
If credibility cannot be established, set is_relevant to false.

STRICT RULES — NEVER VIOLATE:
1. NEVER invent facts not present in the source article
2. NEVER exaggerate or dramatise headlines
3. NEVER state unverified claims as confirmed facts
4. Financial estimates must be calibrated to JBS scale — do not inflate or deflate
5. financial_impact_label MUST always be a non-null string for relevant articles. Use best-estimate ranges.`

// ── Helpers ────────────────────────────────────────────────────────────────────

async function sha256(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Normalise a headline/title into a deduplication fingerprint.
 * Strips punctuation, lowercases, takes first 60 chars.
 * Two articles about the same story will usually share this prefix.
 */
/**
 * Normalise a headline into a deduplication fingerprint.
 * Strips punctuation, stop-words, lowercases, takes first 80 chars.
 * Matches same story covered by multiple outlets.
 */
function headlineFingerprint(text: string): string {
  const STOP = new Set(['the','a','an','in','on','at','of','to','and','or','for','with','by','as','is','are','was','were','be','been','has','have','had','will','would','could','its','it','this','that','from','up','out','new'])
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP.has(w))
    .join(' ')
    .slice(0, 80)
}

function isLikelyRelevant(article: RawArticle): boolean {
  if (TRUSTED_SOURCES.has(article.source)) return true
  const text = `${article.title} ${article.description}`.toLowerCase()
  return RELEVANCE_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()))
}

async function fetchRSSFeed(feedUrl: string, sourceName: string): Promise<RawArticle[]> {
  const res = await fetch(feedUrl, {
    headers: { 'User-Agent': 'JBSSouthernAU-IntelligenceAgent/2.0 (news aggregator)' },
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
    title:       item.title?.['#text']        ?? item.title       ?? '',
    description: item.description?.['#text']  ?? item.description ?? item.summary?.['#text'] ?? item.summary ?? '',
    url:         item.link?.['@_href']         ?? item.link        ?? item.guid?.['#text']    ?? item.guid   ?? '',
    publishedAt: item.pubDate ?? item.updated ?? item.published ?? new Date().toISOString(),
    source:      sourceName,
    content:     item['content:encoded']?.['#text'] ?? item['content:encoded'] ?? item.content?.['#text'] ?? '',
  }))
}

async function analyseArticle(
  groqApiKey: string,
  article: RawArticle & { baseConfidence: number; isOfficial: boolean },
): Promise<AnalysedArticle | null> {
  const userContent = `Source: ${article.source}
Published: ${article.publishedAt}
URL: ${article.url}

Title: ${article.title}

Content:
${(article.description + '\n' + (article.content ?? '')).slice(0, 3500)}`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        temperature: 0.15,
        max_tokens: 1500,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Groq API ${res.status}: ${err}`)
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content ?? ''
    const parsed = JSON.parse(raw) as AnalysedArticle

    // Blend AI confidence with known source reliability
    parsed.confidence_score = Math.round(parsed.confidence_score * 0.7 + article.baseConfidence * 0.3)

    // Override verification based on source trust level:
    // Official sources (MLA, ABARES, government) → VERIFIED_OFFICIAL
    // All curated RSS sources → ANALYST_INFERENCE (we chose them, they're trusted)
    // Unknown sources → keep AI assignment or default UNCONFIRMED
    if (article.isOfficial || OFFICIAL_SOURCE_NAMES.has(article.source)) {
      parsed.verification_status = 'VERIFIED_OFFICIAL'
    } else if (TRUSTED_SOURCES.has(article.source)) {
      // All our curated RSS feeds are trusted industry sources
      parsed.verification_status = 'ANALYST_INFERENCE'
    } else if (!parsed.verification_status) {
      parsed.verification_status = 'UNCONFIRMED'
    }

    // Ensure impact classification aligns with financial amounts
    if (parsed.financial_impact_high_aud != null) {
      if (parsed.financial_impact_high_aud > 500_000) parsed.impact = 'HIGH'
      else if (parsed.financial_impact_high_aud > 100_000) {
        if (parsed.impact === 'LOW') parsed.impact = 'MEDIUM'
      }
    }

    return parsed
  } catch (err) {
    console.error(`Groq analysis failed for "${article.title}":`, err)
    return null
  }
}

// ── Daily briefing generator (runs at end of every news-agent run) ─────────────
//
// Generates today's podcast briefing script if:
//   - No briefing exists for today, OR
//   - The existing briefing is < 200 words (was a fallback/truncated)
//
// Uses the same Groq key that already works for article analysis.

const BRIEFING_SYSTEM_PROMPT = `You are a professional broadcast journalist and senior commodity market analyst presenting the daily morning intelligence briefing for Grasshopper News — a platform used by JBS Southern Australia senior leadership.

CRITICAL WRITING RULES:
- Write in clear, confident spoken English — as if speaking directly into a microphone at 6 AM
- NO bullet points, NO asterisks, NO pound signs, NO markdown of any kind
- Full flowing sentences throughout — no abbreviations that would sound odd when spoken aloud
- Every number must be spoken as words: "two point three million dollars" not "$2.3M", "ninety-four US cents" not "0.94"
- Section transitions must be spoken naturally: "Moving to our market intelligence section." not "## SECTION 2"
- NEVER invent facts not present in the provided articles
- You MUST use ALL provided articles — weave every story into the appropriate section
- TARGET LENGTH: You MUST write at least 900 words. DO NOT stop before 900 words. Count your words. If you reach the Outro before 900 words, go back and expand each section with more analysis and context.

STRUCTURE (follow exactly):

INTRO (60–80 words)
"Good morning. It is [WEEKDAY], [DATE]. I am your Grasshopper News intelligence analyst."
One sentence on market mood and how many significant developments are covered.

SECTION ONE — CRITICAL ALERTS (150–200 words)
Cover every HIGH impact article. For each: what happened, which state is affected, and what action JBS should consider today.

SECTION TWO — MARKET INTELLIGENCE (200–250 words)
Cover market conditions from the articles: any price movements, currency, volumes, demand signals. If specific prices appear in the articles, state them. Interpret what current conditions mean for JBS margins.

SECTION THREE — GLOBAL SIGNALS (150 words)
International stories: trade tensions, disease outbreaks, shipping disruptions, competitor supply changes, currency movements. Assess impact on Australian beef and lamb export competitiveness.

SECTION FOUR — DOMESTIC INDUSTRY NEWS (200 words)
Cover MEDIUM and LOW impact Australian stories: processing, supply chain, weather, regulation, labour, MLA announcements, retail demand.

SECTION FIVE — STRATEGIC OUTLOOK (150 words)
Single biggest risk for JBS this week. Single biggest opportunity. Two or three specific recommended actions referencing stories from the briefing.

OUTRO (40–60 words)
"That concludes your Grasshopper News briefing for [DATE]. Next update tomorrow morning. Stay informed, stay ahead."`

async function generateDailyBriefingIfNeeded(supabase: any, groqApiKey: string): Promise<void> {
  const today     = new Date().toISOString().split('T')[0]
  const dateLabel = new Date().toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // ── Check if a good briefing already exists today ─────────────────────────
  try {
    const { data: existing } = await supabase
      .from('daily_briefings')
      .select('id, briefing_text')
      .eq('briefing_date', today)
      .maybeSingle()

    if (existing) {
      const wordCount = (existing.briefing_text ?? '').split(/\s+/).filter(Boolean).length
      if (wordCount >= 200) {
        console.log(`[briefing] Already have ${wordCount}-word briefing for ${today} — skipping`)
        return
      }
      // Exists but too short (fallback text) — delete and regenerate
      console.log(`[briefing] Existing briefing too short (${wordCount} words) — regenerating`)
      await supabase.from('daily_briefings').delete().eq('briefing_date', today)
    }
  } catch (err) {
    console.warn('[briefing] Could not check existing briefing:', err)
  }

  if (!groqApiKey) {
    console.warn('[briefing] GROQ_API_KEY not set — skipping briefing generation')
    return
  }

  // ── Fetch recent articles ─────────────────────────────────────────────────
  const cutoff36h = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
  const { data: rawArticles } = await supabase
    .from('articles')
    .select(`
      id, headline, summary, why_it_matters, category, impact, regions,
      source, published_at, short_term_impact, medium_term_impact,
      strategic_recommendation, financial_impact_label,
      financial_impact_low_aud, financial_impact_high_aud, sentiment, time_horizon
    `)
    .gte('created_at', cutoff36h)
    .order('published_at', { ascending: false })
    .limit(25)

  const IMPACT_ORD: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }
  const articles = (rawArticles ?? []).sort((a: any, b: any) => {
    const d = (IMPACT_ORD[a.impact] ?? 2) - (IMPACT_ORD[b.impact] ?? 2)
    return d !== 0 ? d : new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  })

  if (articles.length === 0) {
    console.log('[briefing] No articles in last 36h — storing placeholder')
    await supabase.from('daily_briefings').upsert({
      briefing_date: today,
      briefing_text: `Good morning. It is ${dateLabel}. I am your Grasshopper News intelligence analyst. No new intelligence has been recorded in the last thirty-six hours. The platform continues to monitor all major Australian and international feeds around the clock. Full intelligence will be available once new articles are ingested. That concludes today's placeholder update. Stay informed, stay ahead.`,
      article_ids:   [],
      article_count: 0,
      change_count:  0,
    }, { onConflict: 'briefing_date' })
    return
  }

  // ── Format articles for the AI ────────────────────────────────────────────
  function fmtArticle(a: any, i: number): string {
    const fin = a.financial_impact_label
      ?? (a.financial_impact_high_aud ? `Up to AUD ${(a.financial_impact_high_aud / 1_000_000).toFixed(1)} million` : 'Not quantified')
    return [
      `[ARTICLE ${i}] ${a.impact} IMPACT | ${a.category} | Regions: ${(a.regions ?? []).join(', ')} | Source: ${a.source}`,
      `Headline: ${a.headline}`,
      `Financial impact: ${fin}`,
      `Summary: ${a.summary}`,
      `Why it matters: ${a.why_it_matters ?? 'N/A'}`,
      `Short-term: ${a.short_term_impact ?? 'N/A'}`,
      `Recommendation: ${a.strategic_recommendation ?? 'N/A'}`,
    ].join('\n')
  }

  const highCount   = articles.filter((a: any) => a.impact === 'HIGH').length
  const mediumCount = articles.filter((a: any) => a.impact === 'MEDIUM').length
  const lowCount    = articles.filter((a: any) => a.impact === 'LOW').length

  const userPrompt = [
    `DATE: ${dateLabel}`,
    `TOTAL ARTICLES: ${articles.length} (${highCount} HIGH, ${mediumCount} MEDIUM, ${lowCount} LOW)`,
    `YOU MUST USE ALL ${articles.length} ARTICLES. DO NOT STOP BEFORE 900 WORDS.`,
    ``,
    articles.map((a: any, i: number) => fmtArticle(a, i + 1)).join('\n\n---\n\n'),
  ].join('\n')

  // ── Call Groq ─────────────────────────────────────────────────────────────
  let briefingText: string | null = null
  try {
    console.log(`[briefing] Calling Groq for ${articles.length}-article briefing (${dateLabel})…`)
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        temperature: 0.4,
        max_tokens:  2500,
        messages: [
          { role: 'system', content: BRIEFING_SYSTEM_PROMPT },
          { role: 'user',   content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(90_000),
    })

    if (groqRes.ok) {
      const groqData  = await groqRes.json()
      const generated = groqData.choices?.[0]?.message?.content ?? ''
      const wc        = generated.split(/\s+/).filter(Boolean).length
      console.log(`[briefing] Groq returned ${wc} words`)
      if (wc >= 150) {
        briefingText = generated
      } else {
        console.warn(`[briefing] Groq response too short (${wc} words) — discarding`)
      }
    } else {
      const errTxt = await groqRes.text()
      console.warn(`[briefing] Groq API error ${groqRes.status}: ${errTxt}`)
    }
  } catch (err) {
    console.error('[briefing] Groq call failed:', err)
  }

  // ── Fallback if Groq fails ────────────────────────────────────────────────
  if (!briefingText) {
    // Build a structured plain-English summary without AI
    const highItems = articles.filter((a: any) => a.impact === 'HIGH')
    const midItems  = articles.filter((a: any) => a.impact === 'MEDIUM')
    const alerts    = highItems.map((a: any) => `${a.headline}. ${a.why_it_matters ?? ''}`).join(' ')
    const market    = midItems.slice(0, 3).map((a: any) => a.headline).join('. ')
    briefingText = `Good morning. It is ${dateLabel}. I am your Grasshopper News intelligence analyst. ` +
      `Today's briefing covers ${articles.length} developments. ` +
      (highItems.length > 0 ? `Critical alerts: ${alerts} ` : '') +
      (midItems.length  > 0 ? `Market developments: ${market}. ` : '') +
      `That concludes today's Grasshopper News briefing. Stay informed, stay ahead.`
    console.log('[briefing] Using structured fallback (Groq unavailable)')
  }

  // ── Store briefing ────────────────────────────────────────────────────────
  const wordCount = briefingText.split(/\s+/).filter(Boolean).length
  try {
    const { error } = await supabase.from('daily_briefings').upsert({
      briefing_date: today,
      briefing_text: briefingText,
      article_ids:   articles.map((a: any) => a.id),
      article_count: articles.length,
      change_count:  articles.length,
    }, { onConflict: 'briefing_date' })

    if (error) {
      console.error('[briefing] DB upsert failed:', error.message)
    } else {
      console.log(`[briefing] Stored ${wordCount}-word briefing for ${today}`)
    }
  } catch (err) {
    console.error('[briefing] Store failed:', err)
  }
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

  const runStart = Date.now()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SB_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )
  const groqApiKey  = Deno.env.get('GROQ_API_KEY') ?? ''
  const newsApiKey  = Deno.env.get('NEWS_API_KEY') ?? ''

  const { data: runData } = await supabase
    .from('agent_runs').insert({ status: 'running' }).select('id').single()
  const runId = runData?.id

  const stats = { sources_fetched: 0, articles_found: 0, articles_new: 0, articles_analysed: 0 }

  try {
    // ── 1. Collect raw articles ───────────────────────────────────────────────
    const rawArticles: (RawArticle & { baseConfidence: number; isOfficial: boolean })[] = []

    for (const feed of RSS_FEEDS) {
      try {
        const items = await fetchRSSFeed(feed.url, feed.name)
        rawArticles.push(...items.map((a) => ({ ...a, baseConfidence: feed.baseConfidence, isOfficial: feed.isOfficial ?? false })))
        stats.sources_fetched++
      } catch (err) {
        console.warn(`RSS failed: ${feed.name}`, err)
      }
    }

    // Optional: NewsAPI supplementary articles
    if (newsApiKey) {
      try {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const queries = [
          'beef australia livestock',
          'lamb export australia',
          'beef trade china tariff',
          'shipping freight disruption livestock',
          'foot mouth disease cattle',
          'beef cattle market global',
        ]
        for (const q of queries.slice(0, 3)) {
          const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&from=${yesterday}&pageSize=10&apiKey=${newsApiKey}`
          const res = await fetch(url, { signal: AbortSignal.timeout(8_000) })
          if (res.ok) {
            const d = await res.json()
            for (const a of d.articles ?? []) {
              rawArticles.push({ title: a.title ?? '', description: a.description ?? '', url: a.url ?? '', publishedAt: a.publishedAt ?? new Date().toISOString(), source: a.source?.name ?? 'NewsAPI', content: a.content ?? '', baseConfidence: 78, isOfficial: false })
            }
          }
          await new Promise((r) => setTimeout(r, 300))
        }
        stats.sources_fetched++
      } catch (err) {
        console.warn('NewsAPI failed:', err)
      }
    }

    stats.articles_found = rawArticles.length
    console.log(`Fetched ${rawArticles.length} raw articles from ${stats.sources_fetched} sources`)

    // ── 2. Deduplicate by URL hash ────────────────────────────────────────────
    const candidates = await Promise.all(
      rawArticles.filter((a) => a.url && a.title).map(async (a) => ({ ...a, externalId: await sha256(a.url) })),
    )
    const externalIds = candidates.map((c) => c.externalId)
    const { data: existing } = await supabase.from('articles').select('external_id').in('external_id', externalIds)
    const existingSet = new Set((existing ?? []).map((r: any) => r.external_id))
    let newCandidates = candidates.filter((c) => !existingSet.has(c.externalId))

    // ── 2b. Deduplicate by headline similarity (prevent same story from multiple feeds) ──
    // Fetch headlines from the past 7 days as a fingerprint set
    const { data: recentArticles } = await supabase
      .from('articles')
      .select('headline')
      .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    const recentFingerprints = new Set(
      (recentArticles ?? []).map((r: any) => headlineFingerprint(r.headline))
    )
    // Also track fingerprints within the current batch to avoid processing near-duplicates
    const batchFingerprints = new Set<string>()
    newCandidates = newCandidates.filter((c) => {
      const fp = headlineFingerprint(c.title)
      if (recentFingerprints.has(fp) || batchFingerprints.has(fp)) return false
      batchFingerprints.add(fp)
      return true
    })

    stats.articles_new = newCandidates.length
    console.log(`${newCandidates.length} unique new candidates after full deduplication`)

    // ── 3. Pre-filter for relevance ───────────────────────────────────────────
    const relevant = newCandidates.filter(isLikelyRelevant).slice(0, 20)
    console.log(`${relevant.length} articles passed relevance filter (cap 15/run)`)

    // ── 4. AI Analysis ────────────────────────────────────────────────────────
    const toInsert: any[] = []

    for (const article of relevant) {
      const analysis = await analyseArticle(groqApiKey, article)

      if (!analysis || !analysis.is_relevant) {
        console.log(`Discarded: "${article.title.slice(0, 60)}"`)
        continue
      }

      toInsert.push({
        external_id:              article.externalId,
        headline:                 analysis.headline || article.title,
        summary:                  analysis.summary,
        why_it_matters:           analysis.why_it_matters,
        category:                 analysis.category,
        impact:                   analysis.impact,
        regions:                  analysis.regions ?? [],
        source:                   article.source,
        source_url:               article.url,
        published_at:             article.publishedAt,
        short_term_impact:        analysis.short_term_impact,
        medium_term_impact:       analysis.medium_term_impact,
        strategic_recommendation: analysis.strategic_recommendation,
        confidence_score:         analysis.confidence_score,
        tags:                     analysis.tags ?? [],
        sentiment:                analysis.sentiment ?? 0,
        trending:                 analysis.impact === 'HIGH',
        raw_content:              (article.description + ' ' + (article.content ?? '')).slice(0, 5000),
        // New institutional fields
        verification_status:        analysis.verification_status ?? 'UNCONFIRMED',
        financial_impact_low_aud:   analysis.financial_impact_low_aud ?? null,
        financial_impact_high_aud:  analysis.financial_impact_high_aud ?? null,
        financial_impact_label:     analysis.financial_impact_label ?? null,
        time_horizon:               analysis.time_horizon ?? '90D',
      })

      stats.articles_analysed++
      // Groq free tier: ~30 req/min → 2s delay stays well within limits
      await new Promise((r) => setTimeout(r, 2_000))
    }

    // ── 5. Bulk insert ────────────────────────────────────────────────────────
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('articles')
        .upsert(toInsert, { onConflict: 'external_id', ignoreDuplicates: true })
      if (insertError) throw new Error(`DB insert failed: ${insertError.message}`)
      console.log(`Inserted ${toInsert.length} articles`)
    }

    // ── 6. Generate daily briefing if needed ─────────────────────────────────
    // Runs after every article ingestion — auto-creates or refreshes today's
    // podcast script if it's missing or was a short fallback (<200 words).
    try {
      await generateDailyBriefingIfNeeded(supabase, groqApiKey)
    } catch (briefingErr) {
      // Non-fatal — log and continue
      console.warn('[briefing] generateDailyBriefingIfNeeded threw:', briefingErr)
    }

    // ── 7. Update run log ─────────────────────────────────────────────────────
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
