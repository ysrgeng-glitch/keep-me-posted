// ====================================================
// JBS Southern Australia — Impact Scoring Engine
// Weighted scoring model for intelligence prioritisation
// ====================================================

export const CATEGORY_WEIGHTS = {
  'Climate / Weather':       0.82,
  'Export / Trade':          0.80,
  'Legislation / Regulation':0.78,
  'Supply Chain':            0.76,
  'Production Costs':        0.72,
  'Market & Economy':        0.65,
  'Forecasts / Projections': 0.60,
  'Competition':             0.48,
}

export const REGION_MULTIPLIERS = {
  National: 1.15,
  Global:   1.05,
  SA:       1.0,
  VIC:      1.0,
  NSW:      0.95,
  TAS:      0.85,
}

export const IMPACT_VALUES = {
  HIGH:   3,
  MEDIUM: 2,
  LOW:    1,
}

export const SENTIMENT = {
  VERY_NEGATIVE: { min: -1.0, max: -0.6, label: 'Very Negative', color: '#dc2626' },
  NEGATIVE:      { min: -0.6, max: -0.2, label: 'Negative',      color: '#f97316' },
  NEUTRAL:       { min: -0.2, max: 0.2,  label: 'Neutral',       color: '#6b7280' },
  POSITIVE:      { min: 0.2,  max: 0.6,  label: 'Positive',      color: '#10b981' },
  VERY_POSITIVE: { min: 0.6,  max: 1.0,  label: 'Very Positive', color: '#059669' },
}

export const VERIFICATION_LABELS = {
  VERIFIED_OFFICIAL: { label: 'Official Source',    short: 'Official',  color: '#15803d', bg: '#dcfce7', icon: '✓' },
  VERIFIED_MULTI:    { label: 'Multi-Source',       short: 'Multi',     color: '#15803d', bg: '#dcfce7', icon: '✓' },
  ANALYST_INFERENCE: { label: 'Trusted Industry',   short: 'Trusted',   color: '#1d4ed8', bg: '#dbeafe', icon: '◈' },
  UNCONFIRMED:       { label: 'Unconfirmed',        short: 'Unconfirmed',color: '#6b7280', bg: '#f3f4f6', icon: '?' },
}

export const TIME_HORIZON_LABELS = {
  IMMEDIATE: { label: 'Immediate',   short: '0–7d',    color: '#b91c1c', bg: '#fee2e2' },
  '30D':     { label: '30 Days',     short: '30d',     color: '#c2410c', bg: '#ffedd5' },
  '90D':     { label: '90 Days',     short: '90d',     color: '#a16207', bg: '#fef9c3' },
  '6M':      { label: '6 Months',    short: '6m',      color: '#1d4ed8', bg: '#dbeafe' },
  '12M':     { label: '12 Months',   short: '12m',     color: '#6b7280', bg: '#f3f4f6' },
}

// ── Scoring ────────────────────────────────────────────────────────────────────

export function computeImpactScore(article) {
  const categoryWeight  = CATEGORY_WEIGHTS[article.category] ?? 0.5
  const impactValue     = IMPACT_VALUES[article.impact] ?? 1
  const regionMultiplier = article.regions?.length
    ? article.regions.reduce((sum, r) => sum + (REGION_MULTIPLIERS[r] ?? 0.9), 0) / article.regions.length
    : 0.9
  const confidenceFactor = (article.confidenceScore ?? 75) / 100
  const raw = categoryWeight * (impactValue / 3) * regionMultiplier * confidenceFactor
  return Math.round(raw * 100)
}

export function scoreToImpactLevel(score) {
  if (score >= 65) return 'HIGH'
  if (score >= 40) return 'MEDIUM'
  return 'LOW'
}

export function getSentimentDescriptor(value) {
  for (const [, descriptor] of Object.entries(SENTIMENT)) {
    if (value >= descriptor.min && value <= descriptor.max) return descriptor
  }
  return SENTIMENT.NEUTRAL
}

// ── Sorting ────────────────────────────────────────────────────────────────────

export function sortByImpact(articles) {
  return [...articles].sort((a, b) => computeImpactScore(b) - computeImpactScore(a))
}

// ── Filtering ──────────────────────────────────────────────────────────────────

export function filterByImpact(articles, level) {
  if (!level || level === 'ALL') return articles
  return articles.filter((a) => a.impact === level)
}

export function filterByRegion(articles, region) {
  if (!region || region === 'ALL') return articles
  return articles.filter((a) => (a.regions ?? []).includes(region))
}

export function filterByCategory(articles, category) {
  if (!category || category === 'ALL') return articles
  return articles.filter((a) => a.category === category)
}

export function filterByVerification(articles, verification) {
  if (!verification || verification === 'ALL') return articles
  if (verification === 'VERIFIED') {
    return articles.filter((a) => a.verificationStatus === 'VERIFIED_OFFICIAL')
  }
  return articles.filter((a) => a.verificationStatus === verification)
}

export function filterByTimeHorizon(articles, timeHorizon) {
  if (!timeHorizon || timeHorizon === 'ALL') return articles
  return articles.filter((a) => a.timeHorizon === timeHorizon)
}

export function searchArticles(articles, query) {
  if (!query || query.trim() === '') return articles
  const q = query.toLowerCase()
  return articles.filter((a) =>
    a.headline.toLowerCase().includes(q) ||
    a.summary.toLowerCase().includes(q) ||
    (a.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
    a.source.toLowerCase().includes(q) ||
    a.category.toLowerCase().includes(q),
  )
}

const IMPACT_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 }

/** Primary sort: HIGH → MEDIUM → LOW. Secondary: newest first within each group. */
function sortByPriority(articles) {
  return [...articles].sort((a, b) => {
    const impactDiff = (IMPACT_ORDER[a.impact] ?? 2) - (IMPACT_ORDER[b.impact] ?? 2)
    if (impactDiff !== 0) return impactDiff
    return new Date(b.publishedAt) - new Date(a.publishedAt)
  })
}

export function applyFilters(articles, { impact, region, category, verification, timeHorizon, query, sortBy = 'priority' }) {
  let result = [...articles]

  result = filterByImpact(result, impact)
  result = filterByRegion(result, region)
  result = filterByCategory(result, category)
  result = filterByVerification(result, verification)
  result = filterByTimeHorizon(result, timeHorizon)
  result = searchArticles(result, query)

  if (sortBy === 'impact') {
    // Impact score weighting (uses category/region weights)
    result = sortByImpact(result)
  } else if (sortBy === 'confidence') {
    result = result.sort((a, b) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0))
  } else if (sortBy === 'financial') {
    result = result.sort((a, b) => (b.financialImpactHigh ?? 0) - (a.financialImpactHigh ?? 0))
  } else if (sortBy === 'date') {
    result = result.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
  } else {
    // Default: HIGH → MEDIUM → LOW, newest first within each level
    result = sortByPriority(result)
  }

  return result
}

// ── Aggregates ─────────────────────────────────────────────────────────────────

export function computeAggregateSentiment(articles) {
  if (!articles.length) return 0
  const total = articles.reduce((sum, a) => sum + (a.sentiment ?? 0), 0)
  return Number((total / articles.length).toFixed(3))
}

export function getImpactBreakdown(articles) {
  return {
    HIGH:   articles.filter((a) => a.impact === 'HIGH').length,
    MEDIUM: articles.filter((a) => a.impact === 'MEDIUM').length,
    LOW:    articles.filter((a) => a.impact === 'LOW').length,
  }
}

// ── Formatting ─────────────────────────────────────────────────────────────────

export function formatDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function formatDateTime(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })
}

export function formatRelativeTime(isoString) {
  if (!isoString) return ''
  const now   = new Date()
  const then  = new Date(isoString)
  const diffMs    = now - then
  const diffMins  = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays  = Math.floor(diffHours / 24)

  if (diffMins < 60)  return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7)   return `${diffDays}d ago`
  return formatDate(isoString)
}

export function formatAUD(value) {
  if (value == null) return null
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `$${Math.round(value / 1_000)}K`
  return `$${value}`
}
