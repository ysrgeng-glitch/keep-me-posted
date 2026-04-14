// ====================================================
// JBS Southern Australia — useNews Hook
// Reads live data from Supabase when configured,
// falls back to mock data for local development.
// ====================================================

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { mockArticles, mockDailyBriefing } from '../data/mockData'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { applyFilters, computeAggregateSentiment, getImpactBreakdown } from '../utils/scoring'

const DEFAULT_FILTERS = {
  impact:       'ALL',
  region:       'ALL',
  category:     'ALL',
  verification: 'ALL',
  timeHorizon:  'ALL',
  query:        '',
  sortBy:       'priority',
}

// Fetch a wide pool so dedup has enough to pick top stories from
const FETCH_POOL = 200
const TOP_N      = 40   // store top 40 in memory; UI shows 20 with "Load more" for next 20

// Impact sort order: HIGH first, then MEDIUM, then LOW
const IMPACT_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 }

// Stop words removed before fingerprinting so "US Beef Exports Rise" and
// "Rising US Beef Export Volumes" map to the same fingerprint
const STOP_WORDS = new Set([
  'the','a','an','in','on','at','of','to','and','or','for','with','by','as',
  'is','are','was','were','be','been','has','have','had','will','would','could',
  'its','it','this','that','from','up','out','new','say','says','said',
])

function headlineFingerprint(headline) {
  return (headline ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w))
    .join(' ')
    .slice(0, 80)
}

// ── Data fetching ──────────────────────────────────────────────────────────────

async function fetchFromSupabase() {
  const { data, error } = await supabase
    .from('articles')
    .select(`
      id,
      headline,
      summary,
      why_it_matters,
      category,
      impact,
      regions,
      source,
      source_url,
      published_at,
      short_term_impact,
      medium_term_impact,
      strategic_recommendation,
      confidence_score,
      trending,
      tags,
      sentiment,
      created_at,
      verification_status,
      financial_impact_low_aud,
      financial_impact_high_aud,
      financial_impact_label,
      time_horizon
    `)
    // Fetch ordered by impact priority then date so the first 10 after dedup
    // are already the most relevant ones
    .order('published_at', { ascending: false })
    .limit(FETCH_POOL)

  if (error) throw new Error(error.message)

  // 1. Deduplicate: same story from different sources → keep first occurrence
  //    (DB returns newest first so we keep the most recent version)
  const seen = new Set()
  const deduped = (data ?? []).filter((a) => {
    const fp = headlineFingerprint(a.headline)
    if (seen.has(fp)) return false
    seen.add(fp)
    return true
  })

  // 2. Sort by priority: HIGH → MEDIUM → LOW, newest first within each group
  const sorted = deduped.sort((a, b) => {
    const impactDiff = (IMPACT_ORDER[a.impact] ?? 2) - (IMPACT_ORDER[b.impact] ?? 2)
    if (impactDiff !== 0) return impactDiff
    return new Date(b.published_at) - new Date(a.published_at)
  })

  // 3. Take top 10 distinct stories
  const top10 = sorted.slice(0, TOP_N)

  return top10.map((a) => ({
    ...a,
    // camelCase mappings
    sourceUrl:                a.source_url,
    publishedAt:              a.published_at,
    shortTermImpact:          a.short_term_impact,
    mediumTermImpact:         a.medium_term_impact,
    strategicRecommendation:  a.strategic_recommendation,
    confidenceScore:          a.confidence_score,
    whyItMatters:             a.why_it_matters,
    // Institutional fields
    verificationStatus:       a.verification_status   ?? 'UNCONFIRMED',
    financialImpactLow:       a.financial_impact_low_aud  ?? null,
    financialImpactHigh:      a.financial_impact_high_aud ?? null,
    financialImpactLabel:     a.financial_impact_label    ?? null,
    timeHorizon:              a.time_horizon              ?? '90D',
  }))
}

async function fetchMockData() {
  await new Promise((r) => setTimeout(r, 400))
  return mockArticles
}

async function fetchLatestBriefing() {
  const { data } = await supabase
    .from('daily_briefings')
    .select('*')
    .order('briefing_date', { ascending: false })
    .limit(1)
    .single()
  return data ?? null
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useNews() {
  const [allArticles,    setAllArticles]    = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [lastRefreshed,  setLastRefreshed]  = useState(null)
  const [usingLive,      setUsingLive]      = useState(false)
  const [filters,        setFilters]        = useState(DEFAULT_FILTERS)
  const [latestBriefing, setLatestBriefing] = useState(null)
  const realtimeRef = useRef(null)

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    load()
    loadBriefing()
    return () => { realtimeRef.current?.unsubscribe() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    setError(null)
    try {
      if (isSupabaseConfigured) {
        const data = await fetchFromSupabase()
        setAllArticles(data)
        setUsingLive(true)
        subscribeToRealtime()
      } else {
        const data = await fetchMockData()
        setAllArticles(data)
        setUsingLive(false)
      }
      setLastRefreshed(new Date())
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to mock data:', err)
      const data = await fetchMockData()
      setAllArticles(data)
      setUsingLive(false)
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  async function loadBriefing() {
    try {
      if (isSupabaseConfigured) {
        const briefing = await fetchLatestBriefing()
        setLatestBriefing(briefing)
      } else {
        setLatestBriefing(mockDailyBriefing)
      }
    } catch {
      setLatestBriefing(mockDailyBriefing)
    }
  }

  // ── Realtime subscription ─────────────────────────────────────────────────
  function subscribeToRealtime() {
    if (!supabase) return
    realtimeRef.current?.unsubscribe()
    realtimeRef.current = supabase
      .channel('articles-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'articles' }, (payload) => {
        const a = payload.new
        const normalised = {
          ...a,
          sourceUrl:               a.source_url,
          publishedAt:             a.published_at,
          shortTermImpact:         a.short_term_impact,
          mediumTermImpact:        a.medium_term_impact,
          strategicRecommendation: a.strategic_recommendation,
          confidenceScore:         a.confidence_score,
          whyItMatters:            a.why_it_matters,
          verificationStatus:      a.verification_status   ?? 'UNCONFIRMED',
          financialImpactLow:      a.financial_impact_low_aud  ?? null,
          financialImpactHigh:     a.financial_impact_high_aud ?? null,
          financialImpactLabel:    a.financial_impact_label    ?? null,
          timeHorizon:             a.time_horizon              ?? '90D',
        }
        setAllArticles((prev) => {
          // Skip if exact duplicate
          if (prev.some((x) => x.id === normalised.id)) return prev
          // Skip if same story already in the feed (fingerprint dedup)
          const fp = headlineFingerprint(normalised.headline)
          if (prev.some((x) => headlineFingerprint(x.headline) === fp)) return prev
          // Add, re-sort by priority, keep top 10
          const merged = [normalised, ...prev].sort((a, b) => {
            const d = (IMPACT_ORDER[a.impact] ?? 2) - (IMPACT_ORDER[b.impact] ?? 2)
            return d !== 0 ? d : new Date(b.published_at ?? b.publishedAt) - new Date(a.published_at ?? a.publishedAt)
          })
          return merged.slice(0, TOP_N)
        })
        setLastRefreshed(new Date())
      })
      .subscribe()
  }

  // ── Filters ───────────────────────────────────────────────────────────────
  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  // ── Derived data (memoized) ────────────────────────────────────────────────
  const articles = useMemo(
    () => applyFilters(allArticles, filters),
    [allArticles, filters],
  )

  const stats = useMemo(() => ({
    total:           allArticles.length,
    filtered:        articles.length,
    impactBreakdown: getImpactBreakdown(allArticles),
    sentiment:       computeAggregateSentiment(allArticles),
    trending:        allArticles.filter((a) => a.trending),
    // Verification breakdown — trusted = official + analyst inference (curated industry sources)
    verifiedCount:   allArticles.filter((a) =>
      a.verificationStatus === 'VERIFIED_OFFICIAL' || a.verificationStatus === 'ANALYST_INFERENCE'
    ).length,
    // Aggregate financial exposure (sum of high-end estimates for HIGH impact articles)
    totalFinancialExposure: allArticles
      .filter((a) => a.impact === 'HIGH' && a.financialImpactHigh != null)
      .reduce((sum, a) => sum + (a.financialImpactHigh ?? 0), 0),
  }), [allArticles, articles])

  const getArticle = useCallback(
    (id) => allArticles.find((a) => a.id === id) ?? null,
    [allArticles],
  )

  const highImpactArticles = useMemo(
    () => allArticles
      .filter((a) => a.impact === 'HIGH')
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)),
    [allArticles],
  )

  return {
    articles,
    allArticles,
    highImpactArticles,
    loading,
    error,
    usingLive,
    filters,
    setFilter,
    resetFilters,
    refresh: load,
    lastRefreshed,
    stats,
    getArticle,
    latestBriefing,
    refreshBriefing: loadBriefing,
  }
}
