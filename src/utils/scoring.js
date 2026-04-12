// ====================================================
// KEEP ME POSTED — Impact Scoring Engine
// Weighted scoring model for news intelligence
// ====================================================

/**
 * Category base impact weights (0–1 scale)
 * Higher = more intrinsically impactful category
 */
export const CATEGORY_WEIGHTS = {
  'Climate / Weather': 0.82,
  'Export / Trade': 0.80,
  'Legislation / Regulation': 0.78,
  'Supply Chain': 0.76,
  'Production Costs': 0.72,
  'Market & Economy': 0.65,
  'Forecasts / Projections': 0.60,
  'Competition': 0.48,
}

/**
 * Region relevance multipliers for AU beef/lamb industry
 * Based on production volume contribution
 */
export const REGION_MULTIPLIERS = {
  National: 1.15,
  Global: 1.05,
  SA: 1.0,
  VIC: 1.0,
  NSW: 0.95,
  TAS: 0.85,
}

/**
 * Impact level numeric values for calculations
 */
export const IMPACT_VALUES = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
}

/**
 * Sentiment thresholds
 */
export const SENTIMENT = {
  VERY_NEGATIVE: { min: -1.0, max: -0.6, label: 'Very Negative', color: '#dc2626' },
  NEGATIVE: { min: -0.6, max: -0.2, label: 'Negative', color: '#f97316' },
  NEUTRAL: { min: -0.2, max: 0.2, label: 'Neutral', color: '#6b7280' },
  POSITIVE: { min: 0.2, max: 0.6, label: 'Positive', color: '#10b981' },
  VERY_POSITIVE: { min: 0.6, max: 1.0, label: 'Very Positive', color: '#059669' },
}

/**
 * Derive a numeric impact score from an article (0–100)
 * Uses category weight, region multiplier, and confidence
 */
export function computeImpactScore(article) {
  const categoryWeight = CATEGORY_WEIGHTS[article.category] ?? 0.5
  const impactValue = IMPACT_VALUES[article.impact] ?? 1

  // Average region multiplier across all tagged regions
  const regionMultiplier =
    article.regions.reduce((sum, r) => sum + (REGION_MULTIPLIERS[r] ?? 0.9), 0) /
    article.regions.length

  const confidenceFactor = (article.confidenceScore ?? 75) / 100

  // Weighted formula
  const raw = categoryWeight * (impactValue / 3) * regionMultiplier * confidenceFactor
  return Math.round(raw * 100)
}

/**
 * Classify impact level from a raw numeric score
 */
export function scoreToImpactLevel(score) {
  if (score >= 65) return 'HIGH'
  if (score >= 40) return 'MEDIUM'
  return 'LOW'
}

/**
 * Get the sentiment descriptor object for a numeric sentiment value (-1 to 1)
 */
export function getSentimentDescriptor(value) {
  for (const [, descriptor] of Object.entries(SENTIMENT)) {
    if (value >= descriptor.min && value <= descriptor.max) return descriptor
  }
  return SENTIMENT.NEUTRAL
}

/**
 * Sort articles by computed impact score (descending)
 */
export function sortByImpact(articles) {
  return [...articles].sort((a, b) => computeImpactScore(b) - computeImpactScore(a))
}

/**
 * Filter articles by impact level
 */
export function filterByImpact(articles, level) {
  if (!level || level === 'ALL') return articles
  return articles.filter((a) => a.impact === level)
}

/**
 * Filter articles by region (any overlap)
 */
export function filterByRegion(articles, region) {
  if (!region || region === 'ALL') return articles
  return articles.filter((a) => a.regions.includes(region))
}

/**
 * Filter articles by category
 */
export function filterByCategory(articles, category) {
  if (!category || category === 'ALL') return articles
  return articles.filter((a) => a.category === category)
}

/**
 * Full-text search across headline, summary, and tags
 */
export function searchArticles(articles, query) {
  if (!query || query.trim() === '') return articles
  const q = query.toLowerCase()
  return articles.filter(
    (a) =>
      a.headline.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      (a.tags && a.tags.some((t) => t.toLowerCase().includes(q))) ||
      a.source.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q),
  )
}

/**
 * Apply all filters and sorting in one pass
 */
export function applyFilters(articles, { impact, region, category, query, sortBy = 'date' }) {
  let result = [...articles]

  result = filterByImpact(result, impact)
  result = filterByRegion(result, region)
  result = filterByCategory(result, category)
  result = searchArticles(result, query)

  if (sortBy === 'impact') {
    result = sortByImpact(result)
  } else if (sortBy === 'confidence') {
    result = result.sort((a, b) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0))
  } else {
    // Default: sort by date descending
    result = result.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
  }

  return result
}

/**
 * Compute aggregate sentiment across a set of articles
 */
export function computeAggregateSentiment(articles) {
  if (!articles.length) return 0
  const total = articles.reduce((sum, a) => sum + (a.sentiment ?? 0), 0)
  return Number((total / articles.length).toFixed(3))
}

/**
 * Get count breakdown by impact level
 */
export function getImpactBreakdown(articles) {
  return {
    HIGH: articles.filter((a) => a.impact === 'HIGH').length,
    MEDIUM: articles.filter((a) => a.impact === 'MEDIUM').length,
    LOW: articles.filter((a) => a.impact === 'LOW').length,
  }
}

/**
 * Format a date string for display
 */
export function formatDate(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Format a date string as relative time ("2 hours ago", "3 days ago")
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return ''
  const now = new Date()
  const then = new Date(isoString)
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(isoString)
}
